import ReactMarkdown from 'react-markdown';
import { Bot, X, Send } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const markdownClass = cn(
  '[&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_p]:leading-relaxed',
  '[&_ul]:mb-2.5 [&_ol]:mb-2.5 [&_ul]:ps-5 [&_ol]:ps-5 [&_li]:mb-1',
  '[&_pre]:my-2.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-surface-raised [&_pre]:p-3 [&_pre]:text-start [&_pre]:[direction:ltr]',
  '[&_code]:rounded [&_code]:bg-primary-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.82rem] [&_code]:font-semibold [&_code]:text-primary',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-normal [&_pre_code]:text-foreground'
);

/**
 * Right-hand collapsible AI chat panel. `direction-ltr` above targets code
 * blocks specifically — the surrounding chat is RTL, but code always reads LTR.
 */
export default function AiTutorPanel({
  show,
  onClose,
  messages,
  isSending,
  messagesEndRef,
  providers,
  providerKey,
  modelKey,
  onProviderChange,
  onModelChange,
  chatMessage,
  onChatMessageChange,
  onSubmit,
  chatInputRef,
}) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden bg-surface transition-[width] duration-300 ease-in-out',
        show ? 'w-[380px] border-s border-border' : 'w-0'
      )}
    >
      <div className="flex h-full w-[380px] flex-col">
        <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
          <span className="flex items-center gap-1.5 text-sm font-black text-foreground">
            <Bot className="size-[18px]" /> مساعد التعلم الذكي (AI Tutor)
          </span>
          <button type="button" onClick={onClose} title="إغلاق قسم المحادثة" className="text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4.5">
          {messages.map((msg, index) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div key={index} className={cn('flex w-full flex-col', isAssistant ? 'items-start' : 'items-end')}>
                <span className="mb-1 px-1 text-xs font-bold text-muted-foreground">{isAssistant ? 'المساعد الذكي' : 'أنت'}</span>
                <div
                  className={cn(
                    'max-w-[85%] break-words rounded-lg px-3.5 py-3 text-sm leading-relaxed shadow-sm',
                    isAssistant ? 'rounded-se-none border border-border bg-surface-raised' : 'rounded-ss-none border border-primary-border bg-primary-soft',
                    isAssistant && markdownClass
                  )}
                >
                  {isAssistant ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex w-full flex-col items-start">
              <span className="mb-1 px-1 text-xs font-bold text-muted-foreground">المساعد الذكي</span>
              <div className="flex items-center gap-2 rounded-lg rounded-se-none border border-border bg-surface-raised px-3.5 py-2.5 text-sm italic text-muted-foreground">
                <span className="flex gap-0.5">
                  <span className="size-1 animate-pulse rounded-full bg-primary" />
                  <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:0.2s]" />
                  <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:0.4s]" />
                </span>
                المساعد يكتب...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-3.5">
          {/*
           * One bordered card holds everything — textarea, model pickers,
           * send button — so the send action sits inline in the toolbar
           * row instead of as a separate boxed button beside the input.
           */}
          <form
            onSubmit={onSubmit}
            className="flex flex-col rounded-lg border border-border bg-surface transition-all duration-200 ease-in-out focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft"
          >
            <textarea
              ref={chatInputRef}
              value={chatMessage}
              onChange={(e) => onChatMessageChange(e.target.value)}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              placeholder={isSending ? 'جاري صياغة الرد...' : 'اسأل مساعد الذكاء الاصطناعي...'}
              disabled={isSending}
              rows={1}
              className="max-h-[120px] min-h-10 w-full resize-none border-0 bg-transparent px-3 pt-2.5 pb-1.5 text-sm leading-relaxed text-foreground outline-none"
            />

            <div className="flex items-center justify-between gap-2 p-1.5 pt-0.5">
              <div className="flex min-w-0 items-center gap-1">
                <Select
                  value={providerKey}
                  onChange={onProviderChange}
                  className="h-7 w-auto min-w-0 border-0 bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-surface-raised"
                >
                  {providers.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.key}
                    </option>
                  ))}
                </Select>
                <Select
                  value={modelKey}
                  onChange={onModelChange}
                  disabled={!providerKey}
                  className="h-7 w-auto min-w-0 border-0 bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-surface-raised"
                >
                  {providers
                    .find((p) => p.key === providerKey)
                    ?.models?.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.name}
                      </option>
                    ))}
                </Select>
              </div>

              <button
                type="submit"
                disabled={isSending || !chatMessage.trim()}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md transition-all duration-200 ease-in-out',
                  chatMessage.trim() && !isSending
                    ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                    : 'cursor-not-allowed bg-surface-raised text-muted-foreground'
                )}
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
}
