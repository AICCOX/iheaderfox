/* global chrome */
const FALLBACK_LANG = 'english.json';
const LANG_KEY      = 'lang';
const AVAILABLE     = ['english.json', 'japanese.json'];

async function loadLang(fileName) {
    const fallbackUrl = chrome.runtime.getURL(`i18n/${FALLBACK_LANG}`);
    const fallback    = await (await fetch(fallbackUrl)).json();

    if (fileName === FALLBACK_LANG) return fallback;

    try {
        const targetUrl = chrome.runtime.getURL(`i18n/${fileName}`);
        const obj       = await (await fetch(targetUrl)).json();
        // keep meta from obj, inherit only missing phrases from fallback
        return { ...obj, phrases: { ...fallback.phrases, ...obj.phrases } };
    } catch (_) {
        return fallback;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const select     = document.getElementById('langSelect');
    const titleNode  = document.getElementById('title');
    const labelNode  = document.getElementById('langLabel');

    /* populate dropdown */
    for (const file of AVAILABLE) {
        const data = await loadLang(file);
        const opt  = document.createElement('option');
        opt.value  = file;
        opt.textContent = data.langName;
        select.append(opt);
    }

    /* set current */
    const { [LANG_KEY]: current = FALLBACK_LANG } = await chrome.storage.local.get(LANG_KEY);
    select.value = current;

    /* helper to update UI */
    async function applyUI(langFile) {
        const t = await loadLang(langFile);
        titleNode.textContent = t.phrases.popupTitle;
        labelNode.textContent = t.phrases.popupLanguage + ':';
    }
    await applyUI(current);

    /* change handler */
    select.addEventListener('change', async () => {
        const value = select.value;
        await chrome.storage.local.set({ [LANG_KEY]: value });
        await applyUI(value);           // update popup immediately
    });
});
