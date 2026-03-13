/*
================================================================
 SPA LOGIC (script.js)
================================================================
*/

// --- 1. ФУНКЦІЯ ЗАВАНТАЖЕННЯ HTML ---
async function loadSections() {
    const contents = document.querySelectorAll('.tab-content[data-src]');
    const promises = [];

    contents.forEach(content => {
        const src = content.getAttribute('data-src');
        const p = fetch(src)
            .then(res => {
                if (!res.ok) throw new Error(`Error loading ${src}`);
                return res.text();
            })
            .then(html => content.innerHTML = html)
            .catch(err => console.error(err));
        promises.push(p);
    });

    await Promise.all(promises);
    spawnPetals();

    // Завантажити і відрендерити всі JSON-секції
    await Promise.all([
        renderNews(),
        renderScience(),
        renderInternational(),
        renderStudent(),
        renderEntrant(),
        renderDisciplines(),
        renderSpec('spec1'),
        renderSpec('spec2'),
        renderLabs()
    ]);
}

// ================================================================
//  РЕНДЕР З JSON
// ================================================================

async function fetchJSON(path) {
    const res = await fetch(path + '?_=' + Date.now());
    if (!res.ok) throw new Error('Cannot load ' + path);
    return res.json();
}

// --- НОВИНИ ---
async function renderNews() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    try {
        const news = await fetchJSON('data/news.json');
        grid.innerHTML = news.map(n => `
            <div class="news-card bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-sky-500 transition cursor-pointer shadow-lg group flex flex-col" data-news-id="${n.id}">
                <div class="h-56 overflow-hidden relative shrink-0">
                    <img src="${n.img}" alt="${n.title}" class="w-full h-full object-cover transition duration-500">
                    <div class="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-xs text-sky-400 px-2 py-1 rounded border border-sky-500/30">${n.date}</div>
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold text-white mb-3 group-hover:text-sky-400 transition leading-tight">${n.title}</h3>
                    <p class="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">${n.preview}</p>
                    <div class="mt-auto pt-4 border-t border-slate-700/50 flex justify-between items-center">
                        <span class="text-xs text-slate-500">${n.category}</span>
                        <span class="text-sky-500 text-sm font-medium group-hover:underline">Читати далі →</span>
                    </div>
                </div>
            </div>`).join('');
        // Зберегти в глобальну змінну для модалок
        window._newsData = {};
        news.forEach(n => { window._newsData[n.id] = n; });
    } catch(e) { console.error('renderNews:', e); }
}

function renderNewsBlocks(blocks) {
    return (blocks||[]).map(b => {
        if (b.type === 'text')
            return `<p class="text-slate-300 text-sm leading-relaxed mb-3" style="white-space:pre-wrap">${b.value||''}</p>`;
        if (b.type === 'heading')
            return `<h3 class="text-base font-bold text-white mt-5 mb-2 border-b border-slate-700 pb-1">${b.value||''}</h3>`;
        if (b.type === 'image')
            return `<figure class="my-4"><img src="${b.src||''}" alt="${b.caption||''}" class="rounded-xl w-full object-cover max-h-72" onerror="this.style.display='none'">${b.caption?`<figcaption class="text-xs text-slate-500 mt-1 text-center italic">${b.caption}</figcaption>`:''}</figure>`;
        if (b.type === 'file')
            return `<a href="${b.src||'#'}" download class="inline-flex items-center gap-2 text-sky-400 hover:underline font-bold my-2 mr-2 bg-sky-400/10 border border-sky-400/20 px-3 py-1.5 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>${b.label||b.src||'Завантажити'}</a>`;
        if (b.type === 'link')
            return `<div class="my-2"><a href="${b.url||'#'}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition hover:opacity-80" style="background:${b.color||'#60a5fa'}22;border:1px solid ${b.color||'#60a5fa'}44;color:${b.color||'#60a5fa'}">🔗 ${b.label||'Посилання'}</a></div>`;
        if (b.type === 'quote')
            return `<blockquote class="my-3 pl-4 py-2 border-l-4 border-sky-500 bg-sky-500/5 rounded-r-xl italic text-slate-400 text-sm leading-relaxed" style="white-space:pre-wrap">${b.value||''}</blockquote>`;
        if (b.type === 'colored')
            return `<p class="text-sm font-semibold leading-relaxed mb-3" style="color:${b.color||'#60a5fa'};white-space:pre-wrap">${b.value||''}</p>`;
        if (b.type === 'divider')
            return `<hr class="my-5 border-slate-700">`;
        return '';
    }).join('');
}

// --- НАУКА ---
async function renderScience() {
    const el = document.getElementById('science-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/science.json');

        // Новий формат: items[] — картки як новини
        if (d.items && d.items.length) {
            window._sciData = {};
            d.items.forEach(item => { window._sciData[item.id] = item; });

            el.innerHTML = `
            <div class="mb-8 pt-8 text-center">
                <h2 class="text-3xl font-bold text-white">Наукова діяльність</h2>
                ${d.intro ? `<p class="text-slate-400 mt-3 max-w-2xl mx-auto leading-relaxed">${d.intro}</p>` : ''}
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${d.items.map(item => `
                <div class="sci-card bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-sky-500 transition cursor-pointer shadow-lg group flex flex-col" data-sci-id="${item.id}">
                    ${item.img ? `
                    <div class="h-44 overflow-hidden shrink-0">
                        <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.parentElement.style.display='none'">
                    </div>` : `
                    <div class="h-20 flex items-center justify-center bg-gradient-to-br from-sky-900/30 to-slate-800 shrink-0">
                        <svg class="w-10 h-10 text-sky-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.345 2.798H4.044c-1.376 0-2.346-1.799-1.345-2.798L4 14.5"/></svg>
                    </div>`}
                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-base font-bold text-white mb-2 group-hover:text-sky-400 transition leading-tight">${item.title}</h3>
                        ${item.preview ? `<p class="text-slate-400 text-sm line-clamp-3 mb-3 flex-grow">${item.preview}</p>` : '<div class="flex-grow"></div>'}
                        <div class="pt-3 border-t border-slate-700/50 flex justify-end">
                            <span class="text-sky-500 text-xs font-medium group-hover:underline">Детальніше →</span>
                        </div>
                    </div>
                </div>`).join('')}
            </div>`;

        } else {
            // Старий формат: directions[] (зворотна сумісність)
            el.innerHTML = `
            <div class="mb-8 pt-8 text-center"><h2 class="text-3xl font-bold text-white">Наукова діяльність</h2></div>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-slate-800 p-8 rounded-2xl border-t-4 border-sky-500">
                    <h3 class="text-2xl font-bold text-white mb-4">Напрямки досліджень</h3>
                    <ul class="space-y-3 text-slate-300">
                        ${(d.directions||[]).map(dir => `<li class="flex items-center gap-3"><span class="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0"></span>${dir}</li>`).join('')}
                    </ul>
                </div>
                <div class="bg-slate-800 p-8 rounded-2xl">
                    <h3 class="text-2xl font-bold text-white mb-4">Аспірантура</h3>
                    <p class="text-slate-400">${d['aspіrantura_text']||d.aspirantura_text||''}</p>
                </div>
            </div>`;
        }
    } catch(e) { console.error('renderScience:', e); }
}

// --- МІЖНАРОДНІ ЗВ'ЯЗКИ ---
async function renderInternational() {
    const el = document.getElementById('international-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/international.json');
        el.innerHTML = `
        <div class="mb-8 pt-4 text-center"><h2 class="text-3xl md:text-4xl font-bold text-white">Міжнародні зв'язки</h2></div>
        <div class="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
            <p class="text-slate-300 text-lg leading-relaxed mb-8">${d.intro}</p>
            <div class="grid md:grid-cols-3 gap-6">
                ${d.partners.map(p => `
                <div class="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-sky-500 transition text-center">
                    <div class="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                    </div>
                    <h3 class="text-white font-bold mb-2">${p.name}</h3>
                    <p class="text-slate-400 text-sm">${p.country}</p>
                </div>`).join('')}
            </div>
            <div class="mt-10 bg-slate-900/30 p-6 rounded-xl border border-slate-700/50">
                <h3 class="text-xl font-bold text-white mb-4">Можливості для студентів</h3>
                <ul class="space-y-3 text-slate-300 list-disc pl-5">
                    ${d.opportunities.map(o => `<li>${o}</li>`).join('')}
                </ul>
            </div>
        </div>`;
    } catch(e) { console.error('renderInternational:', e); }
}

// --- СТУДЕНТУ (БЛАНКИ) ---
async function renderStudent() {
    const el = document.getElementById('student-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/student.json');
        const docIcon = `<svg class="w-6 h-6 text-sky-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
        el.innerHTML = `
        <div class="mb-8 pt-8"><h2 class="text-3xl font-bold text-white">Бланки документів</h2></div>
        <div class="bg-slate-800 rounded-2xl p-8">
            <h3 class="text-xl font-bold text-white mb-6">Необхідні документи</h3>
            <div class="flex flex-col gap-3">
                ${d.blanks.map(b => `
                <a href="${b.file}" class="flex items-center p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition group border border-slate-700 hover:border-sky-500">
                    ${docIcon}
                    <span class="text-slate-300 group-hover:text-white font-medium">${b.name}</span>
                </a>`).join('')}
            </div>
        </div>`;
    } catch(e) { console.error('renderStudent:', e); }
}

// --- АБІТУРІЄНТУ ---
async function renderEntrant() {
    const el = document.getElementById('entrant-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/entrant.json');
        const colorMap = { sky:'sky', indigo:'indigo', emerald:'emerald' };
        el.innerHTML = `
        <div class="mb-8 pt-4 text-center"><h2 class="text-3xl md:text-4xl font-bold text-white">Абітурієнту</h2></div>
        <div class="grid lg:grid-cols-2 gap-8 items-start">
            <div class="flex flex-col items-center justify-center space-y-6">
                <video class="w-full h-auto rounded-2xl object-contain shadow-lg border border-slate-700" autoplay muted playsinline>
                    <source src="${d.video}" type="video/mp4">Ваш браузер не підтримує відео.
                </video>
                <div class="w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-md space-y-4">
                    ${d.specialties.map((s,i) => `
                    <div${i>0?' class="border-t border-slate-700 pt-3"':''}>
                        <h4 class="text-lg font-bold text-sky-400">${s.code} "${s.name}"</h4>
                        <p class="text-slate-300 text-sm mt-1">Освітньо-професійна програма <span class="text-sky-400 font-medium">"${s.program}"</span></p>
                    </div>`).join('')}
                </div>
            </div>
            <div class="space-y-6">
                <div class="bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-700">
                    <h3 class="text-xl font-bold text-white mb-6 border-b border-sky-500/30 pb-2">Важлива інформація</h3>
                    <div class="space-y-4">
                        ${d.important_links.map(l => `
                        <a href="${l.url}" target="_blank" class="flex items-center group p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-${l.color}-500/50 transition">
                            <div class="w-10 h-10 rounded-full bg-${l.color}-500/10 flex items-center justify-center text-${l.color}-400 mr-4 group-hover:bg-${l.color}-500/20 transition">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                            </div>
                            <div>
                                <span class="block text-white font-medium group-hover:text-${l.color}-400 transition">${l.title}</span>
                                <span class="text-xs text-slate-400">${l.desc}</span>
                            </div>
                        </a>`).join('')}
                    </div>
                </div>
                <div class="bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-700">
                    <h3 class="text-xl font-bold text-white mb-4 border-b border-sky-500/30 pb-2">Додаткові посилання</h3>
                    <ul class="space-y-2 text-sm">
                        ${d.extra_links.map(l => `
                        <li><a href="${l.url}" target="_blank" class="text-sky-400 hover:underline flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                            ${l.title}</a></li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>`;
    } catch(e) { console.error('renderEntrant:', e); }
}

// --- ДИСЦИПЛІНИ ---
async function renderDisciplines() {
    const el = document.getElementById('disciplines-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/disciplines.json');
        el.innerHTML = `<div class="content-block p-6 text-slate-300">
            ${d.groups.map(g => `
            <div class="mb-10">
                <h3 class="text-2xl font-bold text-white mb-4 text-center">${g.code} "${g.name}"</h3>
                <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    ${g.levels.map((lv,i) => `
                    ${i>0?'<div class="w-full h-px bg-slate-700 my-4"></div>':''}
                    <p class="text-sky-400 font-bold text-lg mb-3">${lv.level}${lv.program?` <span class="text-slate-400 font-normal text-sm block md:inline">(${lv.program})</span>`:''}</p>
                    <ul class="list-disc list-inside grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm md:text-base">
                        ${lv.disciplines.map(dis => `<li>${dis}</li>`).join('')}
                    </ul>`).join('')}
                </div>
            </div>`).join('')}
        </div>`;
    } catch(e) { console.error('renderDisciplines:', e); }
}

// --- СПЕЦІАЛЬНОСТІ (spec1 / spec2) ---
async function renderSpec(which) {
    const el = document.getElementById(which + '-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/' + which + '.json');
        const itemHTML = item => item.file
            ? `<li><a href="${item.file}" target="_blank" class="text-slate-300 hover:text-sky-400 hover:underline block">• ${item.name}</a></li>`
            : `<li><span class="text-slate-400 block">• ${item.name}</span></li>`;
        el.innerHTML = `
        <div class="mb-8 pt-4 text-center">
            <h2 class="text-3xl md:text-4xl font-bold text-white">${d.title}</h2>
            <p class="text-xl text-sky-400 mt-2">${d.program}</p>
        </div>
        <div class="grid lg:grid-cols-2 gap-8">
            ${d.columns.map(col => `
            <div class="space-y-8">
                <h3 class="text-2xl font-bold text-sky-400 text-center border-b border-sky-500/30 pb-2">${col.title}</h3>
                ${col.blocks.map(block => `
                <div class="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                    <h4 class="text-lg font-bold text-white mb-4 text-center">${block.title}</h4>
                    <ul class="space-y-2 text-sm">${block.items.map(itemHTML).join('')}</ul>
                </div>`).join('')}
            </div>`).join('')}
        </div>`;
    } catch(e) { console.error('renderSpec ' + which + ':', e); }
}

// --- ЛАБОРАТОРІЇ ---
async function renderLabs() {
    const el = document.getElementById('labs-container');
    if (!el) return;
    try {
        const d = await fetchJSON('data/labs.json');
        el.innerHTML = `
        <div class="mb-8 pt-4 text-center">
            <h2 class="text-3xl md:text-4xl font-bold text-white">Навчальні лабораторії</h2>
        </div>
        <div class="bg-slate-800 rounded-2xl overflow-hidden p-1 shadow-2xl">
            <div class="relative w-full" style="padding-bottom:56.25%">
                <iframe class="absolute top-0 left-0 w-full h-full rounded-xl" src="${d.iframe_url}" allowfullscreen></iframe>
            </div>
        </div>`;
    } catch(e) { console.error('renderLabs:', e); }
}

function spawnPetals() {
    const container = document.getElementById('petalContainer');
    if (!container) return;
    const colors = ['#ffb7c5','#ff8fab','#ffc8d4','#ff9eb5','#ffd6e0','#ffadc0'];
    const count = 38;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'petal';
        const size = 5 + Math.random() * 7;
        const left = Math.random() * 100;
        const delay = Math.random() * 18;
        const dur = 10 + Math.random() * 14;
        const swayDur = 3 + Math.random() * 3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rot = Math.random() * 360;
        p.style.left = left + 'vw';
        p.style.width = size + 'px';
        p.style.height = (size * 0.7) + 'px';
        p.style.background = color;
        p.style.transform = `rotate(${rot}deg)`;
        p.style.boxShadow = 'inset -1px -1px 2px rgba(255,255,255,0.3)';
        if (Math.random() > 0.7) p.style.filter = 'blur(0.5px)';
        p.style.animation = `petalFall ${dur}s ${delay}s linear infinite, petalSway ${swayDur}s ${delay}s ease-in-out infinite`;
        p.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
        container.appendChild(p);
    }
}

// --- 2. ГЛОБАЛЬНІ ФУНКЦІЇ ---

// === Функція перемикання вкладок ===
window.switchTab = function(tabId, scrollTargetId = null, subTabTarget = null, pushHistory = true) {
    // 1. Приховати всі секції
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // 2. Активувати кнопки
    document.querySelectorAll('.nav-btn, .mobile-link').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) btn.classList.add('active');
    });

    // 3. Показати цільову секцію
    const targetSection = document.getElementById('tab-' + tabId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.remove('fade-in');
        void targetSection.offsetWidth; 
        targetSection.classList.add('fade-in');
    }

    // 4. Якщо є під-вкладка
    if (subTabTarget) switchSubTab(subTabTarget);

    // 5. ЗАКРИТИ МОБІЛЬНЕ МЕНЮ
    closeMobileMenu();

    // 6. Скрол
    if (scrollTargetId) {
        setTimeout(() => {
            const el = document.getElementById(scrollTargetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 7. Оновлення URL (тільки якщо потрібно)
    if (pushHistory) {
        const newUrl = `${window.location.origin}${window.location.pathname}#${tabId}`;
        history.pushState({ tab: tabId }, '', newUrl);
    }
};

// --- Функція закриття мобільного меню ---
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('translate-x-0')) {
        mobileMenu.classList.remove('translate-x-0');
        mobileMenu.classList.add('translate-x-full');
        document.body.classList.remove('overflow-hidden');
    }
}

// --- Функція відкриття мобільного меню ---
function openMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('translate-x-full');
        mobileMenu.classList.add('translate-x-0');
        document.body.classList.add('overflow-hidden');
    }
}

// --- Підвкладки ---
window.switchSubTab = function(subTabId) {
    const parentSection = document.getElementById('tab-kafedra'); 
    if (!parentSection) return;

    parentSection.querySelectorAll('.sub-tab-content').forEach(el => el.classList.add('hidden'));
    parentSection.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetSub = document.getElementById(subTabId);
    if (targetSub) targetSub.classList.remove('hidden');
    
    const btns = parentSection.querySelectorAll('.sub-tab-btn');
    btns.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick');
        if (onClickAttr && onClickAttr.includes(subTabId)) {
            btn.classList.add('active');
        }
    });
};

// --- Мобільні підменю ---
window.toggleMobileSubmenu = function(id) {
    const submenu = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    if (submenu) {
        if (submenu.classList.contains('hidden')) {
            submenu.classList.remove('hidden');
            submenu.classList.add('flex');
            if(icon) icon.classList.add('rotate-180');
        } else {
            submenu.classList.add('hidden');
            submenu.classList.remove('flex');
            if(icon) icon.classList.remove('rotate-180');
        }
    }
};

// --- Розгортання тексту ---
window.toggleReadMore = function(btn, targetId) {
    const container = document.getElementById(targetId);
    if (container) {
        container.classList.toggle('text-clamp');
        container.classList.toggle('text-expanded');
        btn.textContent = container.classList.contains('text-expanded') ? 'Згорнути' : 'Читати далі';
    }
};

// --- Модальні вікна (ОНОВЛЕНО) ---
window.openModal = function(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    if (overlay && modal) {
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            modal.classList.remove('opacity-0', 'scale-95');
            modal.classList.add('scale-100');
        }, 10);
        document.body.classList.add('overflow-hidden');
    }
};

window.closeAllModals = function() {
    const overlay = document.getElementById('modal-overlay');
    // Вибираємо всі модалки (Персонал + Новини)
    const modals = document.querySelectorAll('#staff-detail-modal, #news-detail-modal');
    
    modals.forEach(m => {
        m.classList.add('opacity-0', 'scale-95');
        m.classList.remove('scale-100');
        setTimeout(() => m.classList.add('hidden'), 300);
    });
    
    if (overlay) {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);
    }
};

// --- 3. ІНІЦІАЛІЗАЦІЯ ---
document.addEventListener('DOMContentLoaded', async function() {
    await loadSections();

    const mobileMenuBtn = document.getElementById('mobile-menu-button');
    const closeMobileBtn = document.getElementById('close-mobile-menu');
    if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if(closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileMenu);

    // Обробка кліків (делегування подій)
    document.body.addEventListener('click', function(e) {
        
        // 1. КАРТКИ ПЕРСОНАЛУ
        const staffCard = e.target.closest('.staff-card');
        if (staffCard) {
            const staffId = staffCard.dataset.staffId;
            if (typeof staffDetailsData !== 'undefined' && staffDetailsData[staffId]) {
                const data = staffDetailsData[staffId];
                document.getElementById('staff-detail-name').textContent = data.name;
                document.getElementById('staff-detail-title').textContent = data.title;
                document.getElementById('staff-detail-img').src = staffCard.querySelector('img').src;
                document.getElementById('staff-detail-details').innerHTML = data.details;
                
                const discContainer = document.getElementById('staff-detail-disciplines');
                discContainer.innerHTML = data.disciplines.length ? data.disciplines.map(d => `<div class="mb-1">• ${d}</div>`).join('') : 'Немає даних';
                
                const linkContainer = document.getElementById('staff-detail-links');
                linkContainer.innerHTML = data.links.length ? data.links.map(l => `<a href="${l.url}" target="_blank" class="block hover:underline mb-1 text-sky-400">${l.name}</a>`).join('') : 'Немає посилань';

                const bioEl = document.getElementById('staff-detail-bio');
                if(bioEl) bioEl.innerHTML = data.bio || '';

                openModal('staff-detail-modal');
            }
            return; // Виходимо, щоб не перевіряти далі
        }

        // 2. КАРТКИ НАУКИ
        const sciCard = e.target.closest('.sci-card');
        if (sciCard) {
            const sciId = sciCard.dataset.sciId;
            const data = window._sciData && window._sciData[sciId];
            if (data) {
                document.getElementById('news-modal-title').textContent = data.title;
                document.getElementById('news-modal-date').textContent = '';
                const imgEl = document.getElementById('news-modal-img');
                imgEl.src = data.img || '';
                imgEl.parentElement.style.display = data.img ? '' : 'none';
                document.getElementById('news-modal-content').innerHTML = renderNewsBlocks(data.blocks || []);
                if (!data.img) {
                    document.getElementById('news-modal-content').innerHTML =
                        `<p class="text-slate-300 leading-relaxed mb-4">${data.preview||''}</p>` +
                        renderNewsBlocks(data.blocks || []);
                }
                openModal('news-detail-modal');
            }
            return;
        }

        // 2. КАРТКИ НОВИН
        const newsCard = e.target.closest('.news-card');
        if (newsCard) {
            const newsId = newsCard.dataset.newsId;
            const src = (window._newsData && window._newsData[newsId])
                ? window._newsData[newsId]
                : (typeof newsDetailsData !== 'undefined' ? newsDetailsData[newsId] : null);
            if (src) {
                const data = src;
                
                document.getElementById('news-modal-title').textContent = data.title;
                document.getElementById('news-modal-date').textContent = data.date;
                document.getElementById('news-modal-img').src = data.img;
                // Підтримка і старого формату (content), і нового (blocks)
                if (data.blocks) {
                    document.getElementById('news-modal-content').innerHTML = renderNewsBlocks(data.blocks);
                } else {
                    document.getElementById('news-modal-content').innerHTML = data.content || '';
                }
                
                openModal('news-detail-modal');
            }
        }
    });

    // Кнопка "вгору"
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if(scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) scrollBtn.classList.remove('hidden');
            else scrollBtn.classList.add('hidden');
        });
    }

    // --- Визначаємо вкладку з URL при завантаженні ---
    const hash = window.location.hash.replace('#', '');
    switchTab(hash || 'home', null, null, false);
});

// --- Реакція на кнопку "Назад"/"Вперед" у браузері ---
window.addEventListener('popstate', (event) => {
    const tab = event.state?.tab || window.location.hash.replace('#', '');
    switchTab(tab || 'home', null, null, false);
});
