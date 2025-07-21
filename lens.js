/* global chrome */
(async () => {
    const imgUrl = window.__iHeaderFoxURL;
    if (!imgUrl) return;                      // nothing to do

    const FALLBACK_LANG = 'english.json';
    const LANG_KEY      = 'lang';

    /* ---------------- i18n loader ---------------- */
    async function loadLang(fileName) {
        const fallbackUrl = chrome.runtime.getURL(`i18n/${FALLBACK_LANG}`);
        const fallback    = await (await fetch(fallbackUrl)).json();
        if (fileName === FALLBACK_LANG) return fallback;

        try {
            const targetUrl = chrome.runtime.getURL(`i18n/${fileName}`);
            const obj       = await (await fetch(targetUrl)).json();
            return { ...obj, phrases: { ...fallback.phrases, ...obj.phrases } };
        } catch {
            return fallback;
        }
    }

    /* ---------- ask service-worker for pages[] ---------- */
    function getPages(url, langFile) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: 'ihf-get-pages', url, langFile, cacheBust: true },
                resp => {
                    if (chrome.runtime.lastError) {
                        console.error('iHeaderFox message error:', chrome.runtime.lastError);
                        return reject(chrome.runtime.lastError);
                    }
                    if (!resp?.ok) {
                        console.error('iHeaderFox worker error:', resp?.error);
                        return reject(resp?.error || 'Unknown');
                    }
                    resolve(resp.pages);
                }
            );
        });
    }

    /* ---------------- overlay builder ---------------- */
    async function buildOverlay(pages, t) {
        document.getElementById('__foxLens')?.remove();

        const wrap = Object.assign(document.createElement('div'), { id: '__foxLens' });
        const bar  = Object.assign(document.createElement('div'), { className: 'bar' });
        const mkBtn = txt => Object.assign(document.createElement('button'), { textContent: txt });

        const left  = mkBtn(t.phrases.lensPrev);
        const right = mkBtn(t.phrases.lensNext);
        const close = mkBtn(t.phrases.lensClose);
        const label = Object.assign(document.createElement('span'), { className: 'label' });

        bar.append(left, label, right, close);
        const pre = document.createElement('pre');
        wrap.append(bar, pre);
        document.body.append(wrap);

        let idx = 0;
        const render = () => {
            pre.textContent = pages[idx];
            label.textContent = `${idx + 1} / ${pages.length}`;
        };
        render();

        left.onclick  = () => (idx = (idx - 1 + pages.length) % pages.length, render());
        right.onclick = () => (idx = (idx + 1) % pages.length, render());
        close.onclick = () => wrap.remove();

        /* update button captions on live language change */
        chrome.storage.onChanged.addListener(async (chg, area) => {
            if (area === 'local' && chg[LANG_KEY]) {
                const nt = await loadLang(chg[LANG_KEY].newValue || FALLBACK_LANG);
                left.textContent  = nt.phrases.lensPrev;
                right.textContent = nt.phrases.lensNext;
                close.textContent = nt.phrases.lensClose;
                label.textContent = `${idx + 1} / ${pages.length}`;
            }
        });
    }

    /* ---------------- run ---------------- */
    const { [LANG_KEY]: langFile = FALLBACK_LANG } = await chrome.storage.local.get(LANG_KEY);
    const t = await loadLang(langFile);
    const pages = await getPages(imgUrl, langFile);
    buildOverlay(pages, t);
})();
