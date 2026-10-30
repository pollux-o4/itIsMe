export function initializeContact(signal: AbortSignal) {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-email]');
  const label = button?.querySelector<HTMLElement>('[data-copy-label]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  if (!button || !label || !status || !navigator.clipboard?.writeText) return;
  let timer = 0;
  button.hidden = false;
  button.disabled = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail!);
      if (signal.aborted) return;
      button.dataset.copied = '';
      label.textContent = '복사 완료';
      status.textContent = '이메일 주소를 복사했습니다.';
    } catch {
      if (signal.aborted) return;
      delete button.dataset.copied;
      label.textContent = '다시 복사';
      status.textContent = '복사하지 못했습니다. 이메일 주소를 직접 선택해 복사할 수 있습니다.';
    } finally {
      if (!signal.aborted) button.disabled = false;
    }
    if (signal.aborted) return;
    timer = window.setTimeout(() => {
      delete button.dataset.copied;
      label.textContent = '이메일 복사';
      status.textContent = '';
    }, 3500);
  }, { signal });
  signal.addEventListener('abort', () => clearTimeout(timer), { once:true });
}
