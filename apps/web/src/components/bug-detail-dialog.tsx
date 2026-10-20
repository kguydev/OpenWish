import { useEffect, useState } from "react";

import type { BugResponse, BugState, ReporterNotificationStatus } from "@openwish/shared";
import { bugStateLabels } from "@openwish/shared";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { ReporterNotificationNotice } from "#/components/reporter-notification-notice";
import { bugScreenshotUrl } from "#/lib/api";
import { formatDate } from "#/lib/format";
import { cn } from "#/lib/utils";

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 2000;

type BugDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bug: BugResponse | null;
  slug: string;
  onBugSave: (input: { title: string; description: string }) => Promise<void> | void;
  onStateChange: (state: BugState) => Promise<ReporterNotificationStatus | undefined> | ReporterNotificationStatus | undefined;
  onCommentCreate: (description: string) => Promise<ReporterNotificationStatus | undefined> | ReporterNotificationStatus | undefined;
  onDeleteBug: () => Promise<void> | void;
};

export function BugDetailDialog({
  open,
  onOpenChange,
  bug,
  slug,
  onBugSave,
  onStateChange,
  onCommentCreate,
  onDeleteBug,
}: BugDetailDialogProps) {
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [isSavingBug, setIsSavingBug] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reporterNotification, setReporterNotification] = useState<ReporterNotificationStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCommentDraft("");
      setPreviewKey(null);
      setReporterNotification(null);
      setActionError(null);
    }
  }, [open]);

  useEffect(() => {
    setTitleDraft(bug?.title ?? "");
    setDescriptionDraft(bug?.description ?? "");
  }, [bug?.id, bug?.title, bug?.description]);

  if (!bug) {
    return null;
  }

  const hasCopyChanges =
    titleDraft.trim() !== bug.title || descriptionDraft.trim() !== bug.description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="inset-0 left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-card p-0 text-foreground sm:max-w-none"
        showCloseButton
      >
        <DialogTitle className="sr-only">Bug detail</DialogTitle>
        <div className="grid h-dvh min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_240px]">
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-border p-5">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="bug-title" className="text-sm font-medium text-foreground">
                  Title
                </label>
                <span className="text-[11px] text-muted-foreground/80">
                  {titleDraft.length} / {TITLE_MAX}
                </span>
              </div>
              <Input
                id="bug-title"
                className="h-9 border-border bg-muted text-foreground"
                maxLength={TITLE_MAX}
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="bug-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <span className="text-[11px] text-muted-foreground/80">
                  {descriptionDraft.length} / {DESCRIPTION_MAX}
                </span>
              </div>
              <Textarea
                id="bug-description"
                className="min-h-40 border-border bg-muted text-foreground"
                maxLength={DESCRIPTION_MAX}
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Reported by</p>
              {bug.reporterEmail ? (
                <p className="break-all text-xs text-foreground">
                  <a
                    href={`mailto:${bug.reporterEmail}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {bug.reporterEmail}
                  </a>
                </p>
              ) : null}
              <p className="break-all text-[11px] text-muted-foreground/80">
                User ID: <span className="text-foreground/80">{bug.userUUID}</span>
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                {formatDate(bug.createdAt)}
              </p>
            </div>

            {bug.card ? (
              <div className="space-y-2 rounded-md border border-amber-300/15 bg-amber-300/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-200">Affected card</p>
                <p className="text-sm font-medium text-foreground">{bug.card.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[bug.card.setName, bug.card.number].filter(Boolean).join(" · ") || bug.card.id}
                </p>
                {bug.card.imageUrl ? (
                  <img src={bug.card.imageUrl} alt={bug.card.name} className="max-h-48 rounded object-contain" />
                ) : null}
              </div>
            ) : null}

            <div className="mt-auto flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-border bg-transparent text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={
                  !hasCopyChanges ||
                  !titleDraft.trim() ||
                  !descriptionDraft.trim() ||
                  isSavingBug
                }
                onClick={async () => {
                  setIsSavingBug(true);
                  try {
                    setActionError(null);
                    await onBugSave({
                      title: titleDraft.trim(),
                      description: descriptionDraft.trim(),
                    });
                  } catch (error) {
                    setActionError(error instanceof Error ? error.message : "Could not update the bug.");
                  } finally {
                    setIsSavingBug(false);
                  }
                }}
              >
                {isSavingBug ? "Saving…" : "Update"}
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {bug.commentList.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground/80">
                  No comments yet.
                </div>
              ) : (
                bug.commentList.map((comment) => (
                  <div key={comment.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
                      <span>{formatDate(comment.createdAt)}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className={comment.isAdmin ? "text-foreground" : "text-muted-foreground"}>
                        {comment.isAdmin ? "Admin" : "User"}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3 text-sm leading-6",
                        comment.isAdmin
                          ? "border-foreground/15 bg-foreground/[0.04] text-foreground"
                          : "border-border bg-muted text-foreground",
                      )}
                    >
                      {comment.description}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                className="h-9 flex-1 border-border bg-muted text-foreground"
                placeholder={bug.reporterEmail ? "Reply by email…" : "Write an internal reply…"}
                maxLength={DESCRIPTION_MAX}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={async (event) => {
                  if (event.key === "Enter" && !event.shiftKey && commentDraft.trim()) {
                    event.preventDefault();
                    const next = commentDraft.trim();
                    setIsSendingComment(true);
                    try {
                      setActionError(null);
                      setReporterNotification(await onCommentCreate(next) ?? null);
                      setCommentDraft("");
                    } catch (error) {
                      setActionError(error instanceof Error ? error.message : "Could not send the reply.");
                    } finally {
                      setIsSendingComment(false);
                    }
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!commentDraft.trim() || isSendingComment}
                onClick={async () => {
                  const next = commentDraft.trim();
                  if (!next) {
                    return;
                  }
                  setIsSendingComment(true);
                  try {
                    setActionError(null);
                    setReporterNotification(await onCommentCreate(next) ?? null);
                    setCommentDraft("");
                  } catch (error) {
                    setActionError(error instanceof Error ? error.message : "Could not send the reply.");
                  } finally {
                    setIsSendingComment(false);
                  }
                }}
              >
                {isSendingComment ? "Sending…" : bug.reporterEmail ? "Reply & email" : "Send"}
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l border-border p-5">
            <ReporterNotificationNotice status={reporterNotification} error={actionError} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground/80">Status</span>
              <Select
                value={bug.state}
                onValueChange={async (value) => {
                  setIsUpdatingState(true);
                  try {
                    setActionError(null);
                    setReporterNotification(await onStateChange(value as BugState) ?? null);
                  } catch (error) {
                    setActionError(error instanceof Error ? error.message : "Could not update the status.");
                  } finally {
                    setIsUpdatingState(false);
                  }
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-7 w-32 border-border bg-muted text-xs text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-foreground">
                  {Object.entries(bugStateLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isUpdatingState ? (
              <p className="-mt-2 text-right text-[11px] text-muted-foreground/80">Updating…</p>
            ) : null}

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                Screenshots ({bug.screenshotKeys.length})
              </p>
              {bug.screenshotKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground/80">None attached.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {bug.screenshotKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="overflow-hidden rounded border border-border bg-background"
                      onClick={() => setPreviewKey(key)}
                    >
                      <img
                        src={bugScreenshotUrl(slug, bug.id, key)}
                        alt="Bug screenshot"
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Diagnostic context</p>
              {Object.keys(bug.context).length === 0 ? (
                <p className="text-xs text-muted-foreground/80">No V2 context attached.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(bug.context).map(([key, value]) => (
                    <div key={key} className="rounded border border-border bg-muted p-2">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">{key}</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-foreground/80">
                        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="text-left text-sm text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Delete bug
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-border bg-card text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this bug?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This removes the bug, its comments, and all attached screenshots from R2.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border bg-transparent text-foreground/80 hover:bg-foreground/5 hover:text-foreground">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        setActionError(null);
                        await onDeleteBug();
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : "Could not delete the bug.");
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>

      <Dialog
        open={previewKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewKey(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="!max-w-none !w-screen !h-screen !translate-x-0 !translate-y-0 !top-0 !left-0 !rounded-none !border-0 !bg-black/95 !p-0"
        >
          <DialogTitle className="sr-only">Screenshot preview</DialogTitle>
          <button
            type="button"
            className="grid h-full w-full place-items-center"
            onClick={() => setPreviewKey(null)}
          >
            {previewKey ? (
              <img
                src={bugScreenshotUrl(slug, bug.id, previewKey)}
                alt="Bug screenshot"
                className="max-h-[92vh] max-w-[94vw] rounded border border-border object-contain"
              />
            ) : null}
          </button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
