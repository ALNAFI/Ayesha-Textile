import "server-only";

type DriveFile = {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  modifiedTime?: string | null;
  size?: string | null;
};

type ListParams = {
  q: string;
  fields: string;
  pageSize: number;
  pageToken?: string;
  supportsAllDrives: boolean;
  includeItemsFromAllDrives: boolean;
};

type DriveClient = {
  files: {
    list: (
      params: ListParams,
      options?: { signal?: AbortSignal }
    ) => Promise<{
      data: {
        files?: DriveFile[] | null;
        nextPageToken?: string | null;
      };
    }>;
  };
};

export const DRIVE_REQUEST_TIMEOUT_MS = 15_000;
const LIST_TTL_MS = 5 * 60 * 1000;

let listedCache: { at: number; files: DriveFile[] } | null = null;
let listInflight: Promise<DriveFile[]> | null = null;

export function clearFolderListCache() {
  listedCache = null;
}

/** One try, then a single retry. Each attempt has its own timeout. */
export async function withDriveRetry<T>(
  label: string,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.warn(
      `[drive] ${label} failed, retrying once:`,
      error instanceof Error ? error.message : String(error)
    );
    return await run();
  }
}

export function assertDriveFolderId(folderId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not a valid Drive folder id.");
  }
}

/** Lists every non-trashed child in the folder, following nextPageToken. */
export async function listAllFolderFiles(
  drive: DriveClient,
  folderId: string
): Promise<DriveFile[]> {
  assertDriveFolderId(folderId);
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const pageTokenForRequest = pageToken;
    const response = await withDriveRetry("files.list", () =>
      drive.files.list(
        {
          q: `'${folderId}' in parents and trashed = false`,
          fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
          pageSize: 100,
          pageToken: pageTokenForRequest,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        },
        { signal: AbortSignal.timeout(DRIVE_REQUEST_TIMEOUT_MS) }
      )
    );
    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

/**
 * One folder listing for every caller on this instance.
 * forceRefresh re-lists unless a listing is already in flight.
 * A failed listing clears the in-flight promise and leaves the previous cache.
 */
export async function listFolderShared(
  drive: DriveClient,
  folderId: string,
  forceRefresh = false
): Promise<DriveFile[]> {
  const now = Date.now();
  if (!forceRefresh && listedCache && now - listedCache.at < LIST_TTL_MS) {
    return listedCache.files;
  }
  if (listInflight) return listInflight;

  const run = (async () => {
    console.time("[drive] files.list");
    try {
      const files = await listAllFolderFiles(drive, folderId);
      listedCache = { at: Date.now(), files };
      return files;
    } finally {
      console.timeEnd("[drive] files.list");
    }
  })();

  listInflight = run;
  try {
    return await run;
  } finally {
    if (listInflight === run) listInflight = null;
  }
}

export async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  if (items.length === 0) return;
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(Math.max(limit, 1), items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await worker(items[index]);
      }
    }
  );
  await Promise.all(runners);
}
