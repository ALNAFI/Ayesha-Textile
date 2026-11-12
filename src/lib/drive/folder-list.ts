import "server-only";

type DriveFile = {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  modifiedTime?: string | null;
  size?: string | null;
};

type DriveClient = {
  files: {
    list: (params: {
      q: string;
      fields: string;
      pageSize: number;
      pageToken?: string;
      supportsAllDrives: boolean;
      includeItemsFromAllDrives: boolean;
    }) => Promise<{
      data: {
        files?: DriveFile[] | null;
        nextPageToken?: string | null;
      };
    }>;
  };
};

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
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
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
