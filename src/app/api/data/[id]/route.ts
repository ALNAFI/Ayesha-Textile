import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import {
  DriveWriteError,
  downloadForEdit,
  runExclusive,
  uploadEdited,
} from "@/lib/drive/write";
import { invalidateDriveCache } from "@/lib/drive/service";
import { invalidateDriveMetaCache } from "@/lib/drive/list";
import { clearFolderListCache } from "@/lib/drive/folder-list";
import { invalidateCustomerDetail } from "@/lib/customers/detail";
import { invalidateFilePreview } from "@/lib/files/preview";
import {
  EntryInputError,
  appendRowToWorkbook,
  deleteRowFromWorkbook,
  describeWorkbook,
  updateRowInWorkbook,
  type AppendOutcome,
} from "@/lib/data-entry/workbook";
import type {
  EntryAppendBody,
  EntryAppendResult,
  EntryDeleteBody,
  EntryError,
  EntrySchema,
  EntryUpdateBody,
} from "@/lib/data-entry/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const NO_STORE = { "Cache-Control": "private, no-store" };

function fail(error: unknown) {
  if (error instanceof EntryInputError || error instanceof DriveWriteError) {
    const body: EntryError = { ok: false, error: error.message };
    return NextResponse.json(body, { status: error.status, headers: NO_STORE });
  }
  console.error("[data-entry] unexpected error:", error);
  const body: EntryError = {
    ok: false,
    error: "Something went wrong while talking to Google Drive. Please try again.",
  };
  return NextResponse.json(body, { status: 500, headers: NO_STORE });
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const { file, buffer } = await downloadForEdit(id);
    const described = await describeWorkbook(buffer);
    const body: EntrySchema = {
      ok: true,
      fileId: file.id,
      fileName: file.name,
      modifiedTime: file.modifiedTime,
      ...described,
    };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    return fail(error);
  }
}

function cleanValues(input: unknown): Record<string, string> {
  if (typeof input !== "object" || input === null) {
    throw new EntryInputError("Missing form values.");
  }
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

function requireJson(request: Request) {
  // Cross-site form posts cannot send application/json without a preflight.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new EntryInputError("Unsupported request.", 415);
  }
}

function requireRowNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new EntryInputError("Pick a row first.");
  }
  return value;
}

/** Download, change, upload (one at a time per file), then drop server caches. */
async function mutateFile(
  id: string,
  username: string,
  action: "added" | "updated" | "deleted",
  expectedModifiedTime: string | null | undefined,
  change: (buffer: Buffer) => Promise<AppendOutcome>
) {
  const result = await runExclusive(id, async () => {
    const { file, buffer } = await downloadForEdit(id);

    if (
      expectedModifiedTime &&
      file.modifiedTime &&
      expectedModifiedTime !== file.modifiedTime
    ) {
      throw new DriveWriteError(
        "This file changed after you opened it. Reload the page to see the latest rows, then try again.",
        409
      );
    }

    const outcome = await change(buffer);
    const uploaded = await uploadEdited(id, outcome.buffer, file.modifiedTime);
    return { outcome, modifiedTime: uploaded.modifiedTime };
  });

  invalidateDriveCache();
  invalidateDriveMetaCache();
  clearFolderListCache();
  invalidateCustomerDetail(id);
  invalidateFilePreview(id);

  console.log(
    `[data-entry] ${action} row ${result.outcome.rowNumber} in ${id} by ${username}`
  );

  const payload: EntryAppendResult = {
    ok: true,
    action,
    modifiedTime: result.modifiedTime,
    rowNumber: result.outcome.rowNumber,
    newBalance: result.outcome.newBalance,
    nextRow: result.outcome.nextRow,
    tail: result.outcome.tail,
  };
  return NextResponse.json(payload, { headers: NO_STORE });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  try {
    requireJson(request);
    const { id } = await context.params;
    const body = (await request.json()) as Partial<EntryAppendBody> | null;
    const values = cleanValues(body?.values);
    return await mutateFile(
      id,
      auth.session.username,
      "added",
      body?.expectedModifiedTime,
      (buffer) => appendRowToWorkbook(buffer, values)
    );
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  try {
    requireJson(request);
    const { id } = await context.params;
    const body = (await request.json()) as Partial<EntryUpdateBody> | null;
    const rowNumber = requireRowNumber(body?.rowNumber);
    const values = cleanValues(body?.values);
    return await mutateFile(
      id,
      auth.session.username,
      "updated",
      body?.expectedModifiedTime,
      (buffer) => updateRowInWorkbook(buffer, rowNumber, values)
    );
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  try {
    requireJson(request);
    const { id } = await context.params;
    const body = (await request.json()) as Partial<EntryDeleteBody> | null;
    const rowNumber = requireRowNumber(body?.rowNumber);
    return await mutateFile(
      id,
      auth.session.username,
      "deleted",
      body?.expectedModifiedTime,
      (buffer) => deleteRowFromWorkbook(buffer, rowNumber)
    );
  } catch (error) {
    return fail(error);
  }
}
