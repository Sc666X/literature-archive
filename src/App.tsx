import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, BookText, ChevronDown, Cpu, Heart, KeyRound, LibraryBig,
  Loader2, LogIn, LogOut, Mail, Menu, Paperclip, Plus, Save, Send,
  Settings2, Trash2, User, X, RefreshCw
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import mammoth from 'mammoth';

type SectionKey = 'aiWorks' | 'personalStories' | 'personalBooks';
interface Work { id: string; title: string; description: string; date: string; fileName?: string; fileType?: string; filePath?: string; content?: string; }
interface PublishedData { aiWorks: Work[]; personalStories: Work[]; personalBooks: Work[]; }

const DEFAULT_AI_WORKS: Work[] = [{ id: 'mirror-world', title: 'Альтернативная история: Мир Разломанного Зеркала', description: 'Что, если бы история пошла по другому пути? Этот рассказ погружает вас в мир, где одно событие изменило всё.', date: '21.10.2026', fileName: 'mirror-world.docx', filePath: 'mirror-world.docx' }];
const DEFAULT_PUBLISHED_DATA: PublishedData = { aiWorks: DEFAULT_AI_WORKS, personalStories: [], personalBooks: [] };
const REPO_OWNER = 'Sc666X'; const REPO_NAME = 'literature-archive'; const REPO_BRANCH = 'main';
const GITHUB_TOKEN_KEY = 'githubPublishToken';
const PUBLIC_DATA_PATH = 'public/data/works.json'; const PUBLIC_AUTH_PATH = 'public/data/auth.json';
const DB_NAME = 'literatureArchive'; const STORE_NAME = 'files';

function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const req = indexedDB.open(DB_NAME, 1); req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
async function saveFile(key: string, file: File): Promise<void> { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, 'readwrite'); tx.objectStore(STORE_NAME).put(file, key); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }
async function loadFile(key: string): Promise<File | undefined> { try { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, 'readonly'); const req = tx.objectStore(STORE_NAME).get(key); req.onsuccess = () => resolve(req.result as File | undefined); req.onerror = () => reject(req.error); }); } catch { return undefined; } }
async function deleteStoredFile(key: string): Promise<void> { try { const db = await openDB(); return new Promise((resolve) => { const tx = db.transaction(STORE_NAME, 'readwrite'); tx.objectStore(STORE_NAME).delete(key); tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); }); } catch { return; } }

function getBase(): string { const path = window.location.pathname; const idx = path.indexOf('/index.html'); if (idx > 0) return path.slice(0, idx + 1); return path.endsWith('/') ? path : `${path}/`; }
function readJSON<T>(key: string, fallback: T): T { try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } }
function writeJSON(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function withIds(list: any[]): Work[] { return (list || []).map((w: any, i: number) => ({ id: w.id || `legacy-${i}-${(w.title || 'work').slice(0, 12)}`, title: w.title || 'Без названия', description: w.description || '', date: w.date || '', fileName: w.fileName, fileType: w.fileType, filePath: w.filePath, content: w.content })); }
function safePublishedData(input: Partial<PublishedData> | null | undefined): PublishedData { return { aiWorks: withIds(input?.aiWorks || DEFAULT_AI_WORKS), personalStories: withIds(input?.personalStories || []), personalBooks: withIds(input?.personalBooks || []) }; }
function getPublishedDataFromLocalStorage(): PublishedData { return { aiWorks: withIds(readJSON<any[]>('aiWorks', DEFAULT_AI_WORKS)), personalStories: withIds(readJSON<any[]>('personalStories', [])), personalBooks: withIds(readJSON<any[]>('personalBooks', [])) }; }
function persistPublishedData(data: PublishedData) { writeJSON('aiWorks', data.aiWorks); writeJSON('personalStories', data.personalStories); writeJSON('personalBooks', data.personalBooks); }

function utf8_to_b64(str: string) { return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)))); }
function b64_to_utf8(str: string) { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
async function fileToBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const res = reader.result as string; resolve(res.split(',')[1]); }; reader.onerror = reject; reader.readAsDataURL(file); }); }
async function githubGetFile(path: string, token: string) {
  const r = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${REPO_BRANCH}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return null; if (!r.ok) throw new Error(`GitHub API: ${r.status}`); return r.json();
}
async function githubPutFile(path: string, contentBase64: string, token: string, message: string) {
  const existing = await githubGetFile(path, token);
  const r = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message, branch: REPO_BRANCH, content: contentBase64, sha: existing?.sha }) });
  if (!r.ok) { const t = await r.text(); throw new Error(`Ошибка записи: ${r.status}`); } return r.json();
}
async function githubDeleteFile(path: string, token: string, message: string) {
  const existing = await githubGetFile(path, token); if (!existing?.sha) return;
  const r = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message, branch: REPO_BRANCH, sha: existing.sha }) });
  if (!r.ok) throw new Error(`Ошибка удаления: ${r.status}`);
}
async function fetchPublishedData(): Promise<PublishedData> { try { const r = await fetch(`${getBase()}data/works.json`, { cache: 'no-store' }); if (!r.ok) return DEFAULT_PUBLISHED_DATA; return safePublishedData(await r.json()); } catch { return DEFAULT_PUBLISHED_DATA; } }
async function loadRemotePublishedDataForEdit(token: string): Promise<PublishedData> { const file = await githubGetFile(PUBLIC_DATA_PATH, token); if (!file?.content) return DEFAULT_PUBLISHED_DATA; try { return safePublishedData(JSON.parse(b64_to_utf8(String(file.content).replace(/\n/g, '')))); } catch { return DEFAULT_PUBLISHED_DATA; } }
interface AuthConfig { salt: string; passwordHash: string; }
let cachedAuthConfig: AuthConfig | null = null;
async function sha256Hex(input: string): Promise<string> { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)); return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
function randomSalt(): string { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''); }
async function fetchAuthConfig(force = false): Promise<AuthConfig | null> { if (cachedAuthConfig && !force) return cachedAuthConfig; try { const r = await fetch(`${getBase()}data/auth.json`, { cache: 'no-store' }); if (!r.ok) return null; const data = await r.json(); if (!data?.salt || !data?.passwordHash) return null; cachedAuthConfig = { salt: String(data.salt), passwordHash: String(data.passwordHash) }; return cachedAuthConfig; } catch { return null; } }
async function verifyAuthorPassword(entered: string): Promise<boolean> { const cfg = await fetchAuthConfig(); if (!cfg) return false; return (await sha256Hex(`${cfg.salt}:${entered}`)) === cfg.passwordHash; }

const readerStyles = `
  .reader-content { color: black !important; }
  .reader-content p { margin-bottom: 1.5em; line-height: 1.8; color: black !important; }
  .reader-content h1, .reader-content h2, .reader-content h3 { font-weight: bold; margin-top: 2em; margin-bottom: 1em; color: black !important; }
  .reader-content h1 { font-size: 2.25rem; } .reader-content h2 { font-size: 1.875rem; } .reader-content h3 { font-size: 1.5rem; }
  .reader-content strong, .reader-content b { font-weight: 900 !important; color: black !important; }
  .reader-content em, .reader-content i { font-style: italic !important; color: black !important; }
  .reader-content ul, .reader-content ol { margin-left: 1.5rem; margin-bottom: 1.5em; color: black !important; }
  .reader-content ul { list-style-type: disc; } .reader-content ol { list-style-type: decimal; }
`;

type LegalDocKey = 'privacy' | 'consentPd' | 'consentMarketing';

interface LegalSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  afterBullets?: string[];
}

interface LegalDocument {
  key: LegalDocKey;
  title: string;
  subtitle?: string;
  editionDate: string;
  sections: LegalSection[];
}

const LEGAL_DOCUMENTS: Record<LegalDocKey, LegalDocument> = {
  privacy: {
    key: 'privacy',
    title: 'Политика конфиденциальности',
    editionDate: '08.11.2026',
    sections: [
      {
        heading: '1. ОБЩИЕ ПОЛОЖЕНИЯ ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ',
        paragraphs: [
          '1.1. Настоящая Политика конфиденциальности (далее — Политика) составлена в соответствии с частью 2 статьи 18.1 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» (далее — Закон о персональных данных), а также иными нормативными правовыми актами Российской Федерации в области защиты и обработки персональных данных и действует в отношении всех персональных данных (далее — Данные), которые Оператор может получить от субъекта персональных данных, являющегося посетителем и пользователем интернет-ресурса (далее — Пользователь), расположенного по адресу: https://sc666x.github.io/literature-archive/ (далее — Ресурс, Сайт).',
          '1.2. Оператор — лицо, самостоятельно организующее и осуществляющее обработку персональных данных, а также определяющее цели такой обработки, состав персональных данных, подлежащих обработке, и действия (операции), совершаемые с персональными данными. Оператором является: Индивидуальный предприниматель Козлов Константин Дмитриевич, ИНН 143408753004, адрес электронной почты: kostya.kozlov280.dmit@gmail.com.',
          '1.3. Управление Ресурсом и обработка поступающих обращений Пользователей осуществляются непосредственно Оператором без привлечения сторонних сотрудников.',
          '1.4. Оператор обеспечивает защиту обрабатываемых персональных данных от несанкционированного доступа и разглашения, неправомерного использования, изменения, блокирования или утраты в соответствии с требованиями Федерального закона № 152-ФЗ.',
          '1.5. Оператор вправе вносить изменения в настоящую Политику. При внесении изменений указывается дата актуальной редакции документа. Новая редакция Политики вступает в силу с момента её размещения на Ресурсе, если иное не предусмотрено новой редакцией Политики.',
          '1.6. Настоящая Политика является общедоступным информационным документом Оператора и постоянно размещена в нижней части (подвале) Ресурса. Просмотр литературных произведений и материалов Ресурса является свободным и не требует регистрации или предоставления Пользователем персональных данных. При направлении сообщения через форму обратной связи на Ресурсе Пользователь предварительно знакомится с настоящей Политикой и выражает отдельное добровольное согласие на обработку своих персональных данных путём проставления отметки в соответствующем чекбоксе формы.',
          '1.7. Направление Пользователю рекламно-информационных материалов осуществляется исключительно при наличии отдельного добровольного согласия Пользователя, выраженного путём проставления отметки в дополнительном (необязательном) чекбоксе формы обратной связи на Ресурсе.',
          '1.8. Пользователь вправе в любой момент отозвать ранее предоставленное согласие на обработку персональных данных, направив уведомление Оператору на адрес электронной почты: kostya.kozlov280.dmit@gmail.com с пометкой «Отзыв согласия на обработку персональных данных». Оператор прекращает обработку персональных данных и уничтожает их в сроки, установленные законодательством Российской Федерации (не позднее 30 календарных дней с даты поступления отзыва, а в случаях, предусмотренных статьёй 21 Закона о персональных данных, — в течение 10 рабочих дней), если их дальнейшее хранение не требуется в силу закона, и направляет Пользователю ответное уведомление по электронной почте.',
          '1.9. Ресурс не использует файлы cookies, сторонние счётчики веб-аналитики (Яндекс.Метрика, Google Analytics и аналогичные) или рекламные трекеры для сбора сведений о посетителях. Технические данные работы интерфейса Ресурса (локальный кэш каталога произведений, а в режиме автора — настройки авторизации и локальные черновики файлов) сохраняются исключительно на стороне браузера самого Пользователя (Local Storage и IndexedDB) и автоматически третьим лицам не передаются.'
        ]
      },
      {
        heading: '2. СОСТАВ И ОСОБЕННОСТИ ПОЛУЧЕНИЯ ПЕРСОНАЛЬНЫХ ДАННЫХ',
        paragraphs: [
          '2.1. Оператор обрабатывает только те персональные данные, которые соответствуют заявленным целям обработки и самостоятельно предоставляются Пользователем при обращении к Оператору:'
        ],
        bullets: [
          'имя (псевдоним или фамилия, имя, отчество — в том объёме, в каком их указал сам Пользователь в форме обратной связи);',
          'адрес электронной почты (e-mail);',
          'тема и текст сообщения (включая иные сведения, добровольно указанные Пользователем в тексте обращения);',
          'при самостоятельном переходе Пользователя по прямой ссылке для связи с Оператором в мессенджере Telegram (@kkmrdr) — отображаемое имя, никнейм (username) и идентификатор аккаунта в Telegram, передаваемые самим мессенджером при отправке сообщения.'
        ],
        afterBullets: [
          '2.2. Ресурс представляет собой статическое одностраничное веб-приложение без серверной базы данных анкет посетителей. Форма «Связаться со мной» работает по протоколу mailto: — при нажатии кнопки «Отправить сообщение» на устройстве Пользователя открывается его почтовая программа с подготовленным текстом письма в адрес Оператора (kostya.kozlov280.dmit@gmail.com), которое Пользователь отправляет самостоятельно.',
          '2.3. При загрузке страниц статического хостинга Ресурса (GitHub Pages) серверами хостинг-провайдера в автоматическом режиме обрабатываются стандартные сетевые параметры HTTP-запроса (IP-адрес, сведения о браузере и операционной системе User-Agent, время обращения) исключительно в целях технической доставки содержимого страницы; Оператор не ведёт самостоятельного сбора, хранения или сопоставления указанных технических данных с личностью Пользователя.',
          '2.4. Оператор не собирает специальные категории персональных данных и биометрические персональные данные. Пользователь не вправе предоставлять через Ресурс персональные данные третьих лиц без наличия у него законных оснований.'
        ]
      },
      {
        heading: '3. ЦЕЛИ СБОРА И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ',
        paragraphs: [
          '3.1. Персональные данные Пользователя обрабатываются Оператором исключительно в следующих целях:'
        ],
        bullets: [
          'установление обратной связи с Пользователем, рассмотрение входящих писем, читательских отзывов, вопросов и предложений о литературном или ином сотрудничестве, направление ответов Пользователю;',
          'направление Пользователю рекламно-информационных материалов (анонсов новых рассказов, книг, литературных публикаций и авторских проектов Оператора) — строго при наличии отдельного согласия Пользователя;',
          'исполнение обязанностей Оператора, предусмотренных законодательством Российской Федерации, включая рассмотрение запросов и отзывов согласий субъектов персональных данных.'
        ],
        afterBullets: [
          '3.2. Обработка персональных данных, несовместимая с указанными целями, не допускается. В случае изменения целей обработки Оператор предварительно уведомляет Пользователя и запрашивает отдельное согласие.'
        ]
      },
      {
        heading: '4. ПОРЯДОК, СРОКИ ОБРАБОТКИ И ПЕРЕДАЧА ДАННЫХ',
        paragraphs: [
          '4.1. Обработка персональных данных осуществляется смешанным способом (с использованием средств автоматизации и без использования таких средств) в соответствии с требованиями Федерального закона № 152-ФЗ и включает: сбор, запись, систематизацию, хранение, уточнение (обновление, изменение), использование, блокирование, удаление и уничтожение.',
          '4.2. Персональные данные хранятся и обрабатываются не дольше, чем этого требуют цели обработки: в течение 5 (пяти) лет с момента предоставления согласия либо до момента достижения цели обращения или поступления от Пользователя отзыва согласия — в зависимости от того, какое событие наступит раньше. По истечении срока или при отзыве согласия данные удаляются (уничтожаются) Оператором.',
          '4.3. Оператор не публикует персональные данные Пользователей в открытом доступе и не передаёт их третьим лицам, за исключением следующих случаев:'
        ],
        bullets: [
          'получения отдельного прямого согласия Пользователя на такую передачу;',
          'предоставления информации по законному мотивированному запросу уполномоченных государственных органов Российской Федерации в случаях и порядке, прямо установленных законодательством РФ.'
        ]
      },
      {
        heading: '5. ПРАВА ПОЛЬЗОВАТЕЛЯ И МЕРЫ ЗАЩИТЫ',
        paragraphs: [
          '5.1. Пользователь вправе получать у Оператора сведения, касающиеся обработки его персональных данных (статья 14 Закона о персональных данных), требовать уточнения своих персональных данных, их блокирования или уничтожения в случае, если данные являются неполными, устаревшими, неточными или незаконно полученными, а также в любой момент отозвать предоставленные согласия путём направления письма на e-mail: kostya.kozlov280.dmit@gmail.com.',
          '5.2. Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, предоставления и распространения (в том числе ограничение доступа к почтовому ящику и устройствам Оператора, использование сложных паролей, двухфакторной аутентификации и средств антивирусной защиты) в соответствии со статьёй 19 Федерального закона № 152-ФЗ.'
        ]
      },
      {
        heading: '6. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ',
        paragraphs: [
          '6.1. Настоящая Политика регулирует отношения между Пользователем и Оператором в части обработки персональных данных при использовании Ресурса https://sc666x.github.io/literature-archive/.',
          '6.2. Вопросы, не урегулированные настоящей Политикой, разрешаются в соответствии с действующим законодательством Российской Федерации. По всем вопросам, связанным с обработкой персональных данных, Пользователь может связаться с Оператором по электронной почте: kostya.kozlov280.dmit@gmail.com.'
        ]
      }
    ]
  },
  consentPd: {
    key: 'consentPd',
    title: 'Согласие на обработку персональных данных',
    subtitle: 'СОГЛАСИЕ субъекта на обработку персональных данных',
    editionDate: '08.11.2026',
    sections: [
      {
        paragraphs: [
          'Действуя свободно, своей волей и в своем интересе, а также подтверждая свою дееспособность, я (далее — Пользователь) путём проставления отметки (галочки) в соответствующем чекбоксе формы обратной связи на интернет-ресурсе https://sc666x.github.io/literature-archive/ (далее — Ресурс) предоставляю настоящее отдельное согласие на обработку моих персональных данных Оператору — Индивидуальному предпринимателю Козлову Константину Дмитриевичу, ИНН 143408753004, e-mail: kostya.kozlov280.dmit@gmail.com (далее — Оператор).'
        ]
      },
      {
        heading: 'Перечень персональных данных, на обработку которых даётся согласие:',
        bullets: [
          'имя (псевдоним или фамилия, имя, отчество — в объёме, самостоятельно указанном Пользователем в форме обратной связи);',
          'адрес электронной почты (e-mail);',
          'тема и текст сообщения (а также иные сведения, которые Пользователь по собственной инициативе указал в тексте обращения).'
        ]
      },
      {
        heading: 'Цели обработки персональных данных:',
        bullets: [
          'установление с Пользователем обратной связи, рассмотрение направленного сообщения, читательского отзыва, вопроса или предложения о сотрудничестве и подготовка ответа Оператора;',
          'учёт факта предоставления настоящего согласия и взаимодействие с Пользователем по вопросам реализации его прав как субъекта персональных данных.'
        ],
        afterBullets: [
          'Настоящее согласие не распространяется на направление рекламно-информационных рассылок (для которых на Ресурсе предусмотрен отдельный необязательный чекбокс и самостоятельное согласие).'
        ]
      },
      {
        heading: 'Перечень действий и способы обработки:',
        paragraphs: [
          'Согласие предоставляется на совершение следующих действий (операций) с персональными данными с использованием средств автоматизации и без использования таких средств: сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, блокирование, удаление и уничтожение персональных данных в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».'
        ]
      },
      {
        heading: 'Срок действия согласия:',
        paragraphs: [
          'Настоящее согласие действует в течение 5 (пяти) лет с момента его предоставления либо до момента достижения целей обработки или поступления от Пользователя отзыва согласия — в зависимости от того, какое событие наступит раньше.'
        ]
      },
      {
        heading: 'Пользователь осознаёт и подтверждает, что:',
        bullets: [
          'имеет право запрашивать у Оператора информацию об обработке своих персональных данных в порядке статьи 14 Федерального закона № 152-ФЗ;',
          'отказ от предоставления настоящего согласия делает невозможной отправку сообщения через форму обратной связи на Ресурсе (при этом чтение и просмотр опубликованных на Ресурсе произведений остаются полностью доступными);',
          'вправе отозвать настоящее согласие в любой момент, направив уведомление в свободной форме с пометкой «Отзыв согласия на обработку персональных данных» на адрес электронной почты Оператора: kostya.kozlov280.dmit@gmail.com; Оператор прекращает обработку и уничтожает персональные данные в установленный законом срок (не позднее 30 календарных дней с даты поступления отзыва, если иное не требуется по закону) с направлением Пользователю уведомления по e-mail;',
          'предоставленные им персональные данные являются точными и достоверными, относятся лично к Пользователю и не нарушают прав и законных интересов третьих лиц.'
        ]
      },
      {
        heading: 'Оператор обязуется:',
        bullets: [
          'соблюдать конфиденциальность персональных данных и не передавать их третьим лицам без отдельного прямого согласия Пользователя (за исключением случаев, прямо предусмотренных законодательством Российской Федерации);',
          'не публиковать и не распространять персональные данные Пользователя в открытом доступе;',
          'обеспечивать необходимые правовые, организационные и технические меры защиты персональных данных в соответствии с законодательством Российской Федерации.'
        ]
      }
    ]
  },
  consentMarketing: {
    key: 'consentMarketing',
    title: 'Согласие на получение рекламно-информационных материалов',
    subtitle: 'СОГЛАСИЕ на получение рекламно-информационных материалов',
    editionDate: '08.11.2026',
    sections: [
      {
        paragraphs: [
          'В соответствии с частью 1 статьи 18 Федерального закона от 13.03.2006 № 38-ФЗ «О рекламе» и Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных», действуя свободно, своей волей и в своем интересе, проставляя отметку (галочку) в отдельном необязательном чекбоксе «Я даю согласие на получение рекламно-информационных материалов» в форме обратной связи на интернет-ресурсе https://sc666x.github.io/literature-archive/ (далее — Ресурс), я (далее — Пользователь) выражаю свое предварительное согласие на получение от Индивидуального предпринимателя Козлова Константина Дмитриевича, ИНН 143408753004, e-mail: kostya.kozlov280.dmit@gmail.com (далее — Оператор), рекламно-информационных материалов, в том числе:'
        ],
        bullets: [
          'анонсов выхода новых литературных произведений, рассказов, книг и авторских серий Оператора;',
          'уведомлений о новых публикациях и обновлениях разделов на Ресурсе https://sc666x.github.io/literature-archive/;',
          'информации о творческих проектах, авторских встречах, предзаказах книг и специальных предложениях Оператора.'
        ]
      },
      {
        heading: 'Способ направления материалов и используемые данные:',
        bullets: [
          'отправка электронных писем на адрес электронной почты (e-mail), самостоятельно указанный Пользователем при заполнении формы обратной связи на Ресурсе (с возможным обращением по указанному Пользователем имени).'
        ]
      },
      {
        heading: 'Добровольность и условия конфиденциальности:',
        paragraphs: [
          'Предоставление настоящего согласия является полностью добровольным и не влияет на возможность просмотра материалов Ресурса или отправки обычного сообщения через форму обратной связи.',
          'Предоставляя настоящее согласие, я подтверждаю, что условия настоящего согласия мне понятны, указанный мною адрес электронной почты принадлежит лично мне и является достоверным, а также осознаю запрет на указание контактных данных третьих лиц без их согласия.',
          'Оператор использует адрес электронной почты и имя Пользователя исключительно для направления перечисленных рекламно-информационных материалов, обеспечивает их конфиденциальность в соответствии с Федеральным законом № 152-ФЗ и не передаёт контактные данные Пользователя сторонним рекламодателям.'
        ]
      },
      {
        heading: 'Срок действия согласия и порядок отказа от рассылки:',
        paragraphs: [
          'Настоящее согласие действует в течение 5 (пяти) лет с момента его предоставления либо до момента отказа Пользователя от получения рекламно-информационных материалов (отзыва согласия) — в зависимости от того, какое событие наступит раньше.',
          'Настоящее согласие может быть отозвано мною в любой момент путём направления письменного отказа (например, с пометкой «Отказ от рассылки» или «Отписаться») в свободной форме на электронную почту Оператора: kostya.kozlov280.dmit@gmail.com (в том числе ответным письмом на любое полученное сообщение).',
          'В соответствии с частью 1 статьи 18 Федерального закона № 38-ФЗ «О рекламе» Оператор незамедлительно прекращает направление рекламно-информационных материалов на адрес электронной почты Пользователя с момента получения отказа (отзыва согласия) и по запросу Пользователя направляет подтверждение прекращения рассылки.'
        ]
      }
    ]
  }
};

function LegalModal({ docKey, onClose }: { docKey: LegalDocKey | null; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const doc = docKey ? LEGAL_DOCUMENTS[docKey] : null;

  useEffect(() => {
    if (!docKey) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    scrollRef.current?.scrollTo(0, 0);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [docKey, onClose]);

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          key={doc.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          >
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 py-5 border-b border-gray-200 bg-gray-50 shrink-0">
              <div>
                <h2 id="legal-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                  {doc.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Редакция документа от {doc.editionDate}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть документ"
                className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all shrink-0 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white px-6 sm:px-10 py-8">
              <div className="max-w-3xl mx-auto text-gray-800 text-[15px] sm:text-base leading-relaxed space-y-6">
                {doc.subtitle && (
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {doc.subtitle}
                  </p>
                )}
                {doc.sections.map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    {section.heading && (
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 pt-2">
                        {section.heading}
                      </h3>
                    )}
                    {section.paragraphs?.map((p, pIdx) => (
                      <p key={pIdx} className="text-gray-800 leading-relaxed">
                        {p}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="list-disc pl-6 space-y-2 text-gray-800">
                        {section.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.afterBullets?.map((p, aIdx) => (
                      <p key={aIdx} className="text-gray-800 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getFileType(name: string): 'docx' | 'doc' | 'pdf' | 'txt' | 'other' {
  const n = (name || '').toLowerCase();
  if (n.endsWith('.docx')) return 'docx'; if (n.endsWith('.doc')) return 'doc';
  if (n.endsWith('.pdf')) return 'pdf'; if (n.endsWith('.txt')) return 'txt';
  return 'other';
}

function ReaderModal({ work, onClose }: { work: Work | null; onClose: () => void }) {
  const [html, setHtml] = useState(''); const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!work) return; document.body.style.overflow = 'hidden'; setHtml(''); setPdfUrl(''); setError(''); let cancelled = false; let objectUrl = '';
    (async () => { setLoading(true); try {
      let fileBlob: Blob | null = null; let fileName = work.filePath || work.fileName || '';
      if (work.filePath) { try { const url = `${getBase()}library/${work.filePath}`.replace(/\/\//g, '/'); const resp = await fetch(url); if (resp.ok) fileBlob = await resp.blob(); } catch { } }
      if (!fileBlob) { const local = await loadFile(work.id); if (local) { fileBlob = local; fileName = local.name || fileName; } }
      if (work.content && !fileBlob) { if (!cancelled) setHtml(`<div class="whitespace-pre-wrap">${work.content.replace(/</g, '&lt;')}</div>`); return; }
      if (!fileBlob) { if (!cancelled) setError('Файл пока недоступен.'); return; }
      const type = getFileType(fileName);
      if (type === 'pdf') { objectUrl = URL.createObjectURL(new Blob([fileBlob], { type: 'application/pdf' })); if (!cancelled) setPdfUrl(objectUrl); }
      else if (type === 'docx' || type === 'doc') { const buf = await fileBlob.arrayBuffer(); const result = await mammoth.convertToHtml({ arrayBuffer: buf }); if (!cancelled) setHtml(result.value); }
      else if (type === 'txt') { const buf = await fileBlob.arrayBuffer(); let text = ''; try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { try { text = new TextDecoder('windows-1251').decode(buf); } catch { text = new TextDecoder('utf-8').decode(buf); } } if (!cancelled) setHtml(`<div class="whitespace-pre-wrap">${text.replace(/</g, '&lt;')}</div>`); }
      else { if (!cancelled) setError('Формат файла не поддерживается.'); }
    } catch (e: any) { if (!cancelled) setError(e?.message || 'Ошибка открытия.'); } finally { if (!cancelled) setLoading(false); } })();
    return () => { cancelled = true; document.body.style.overflow = ''; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [work]);
  return (<AnimatePresence>{work && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex flex-col bg-white"><style>{readerStyles}</style>
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50"><h2 className="text-lg font-bold text-gray-900 truncate">{work.title}</h2><button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all cursor-pointer"><X size={24} /></button></div>
    {pdfUrl && !loading ? (<iframe src={pdfUrl} className="flex-1 w-full border-0" title={work.title} />) : (
    <div className="flex-1 overflow-y-auto bg-white"><div className="max-w-3xl mx-auto px-6 py-12">
      {loading && <div className="flex flex-col items-center py-20 text-gray-400"><Loader2 className="animate-spin mb-4" size={40} /><p>Загрузка...</p></div>}
      {!loading && error && <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600"><p>{error}</p></div>}
      {!loading && !error && html && <div className="reader-content max-w-none text-black text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />}
    </div></div>)}</motion.div>)}</AnimatePresence>);
}
interface WorksSectionProps { id: string; title: string; icon: React.ReactNode; works: Work[]; isAdmin: boolean; publishReady: boolean; sectionKey: SectionKey; onCreate: (section: SectionKey, title: string, description: string, file: File | null) => Promise<void>; onDelete: (section: SectionKey, index: number) => Promise<void>; onRead: (work: Work) => void; }

function WorksSection({ id, title, icon, works, isAdmin, publishReady, sectionKey, onCreate, onDelete, onRead }: WorksSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState(''); const [fDesc, setFDesc] = useState(''); const [fFile, setFFile] = useState<File | null>(null); const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fTitle.trim()) return; setSubmitting(true);
    try { await onCreate(sectionKey, fTitle.trim(), fDesc.trim(), fFile); setFTitle(''); setFDesc(''); setFFile(null); setShowForm(false); }
    finally { setSubmitting(false); }
  };

  if (works.length === 0 && !isAdmin) return null;

  return (
    <section id={id} className="py-20 border-b border-white/5 bg-stone-900/50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-4"><div className="p-3 bg-indigo-600 rounded-xl text-white">{icon}</div><h2 className="text-3xl font-bold text-white">{title}</h2></div>
          {isAdmin && (<button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20 self-start cursor-pointer">{showForm ? <X size={20} /> : <Plus size={20} />}<span>{showForm ? 'Отмена' : 'Добавить'}</span></button>)}
        </div>

        {isAdmin && showForm && (
          <form onSubmit={submit} className="mb-12 p-8 bg-white/5 border border-indigo-500/30 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Название</label><input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)} className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Введите название..." required /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Файл (PDF, DOC, DOCX, TXT)</label><button type="button" onClick={() => fileRef.current?.click()} className="w-full px-4 py-3 bg-stone-800 border border-white/10 border-dashed rounded-lg text-gray-400 hover:border-indigo-500 transition-all flex items-center justify-between gap-2 cursor-pointer"><span className="truncate">{fFile ? fFile.name : 'Выбрать файл...'}</span><Paperclip size={16} /></button><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => setFFile(e.target.files?.[0] ?? null)} /></div>
            </div>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white mb-6" placeholder="Описание..." rows={3} />
            <button type="submit" disabled={submitting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-bold transition-all cursor-pointer">{submitting ? 'Сохранение...' : publishReady ? 'Опубликовать для всех' : 'Сохранить локально'}</button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((w, i) => (
            <div key={w.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full transition-all">
              <div className="flex justify-between items-start mb-4 gap-2"><h3 className="text-xl font-bold text-white leading-tight">{w.title}</h3><span className="text-[10px] text-gray-500 uppercase shrink-0 mt-1">{w.date}</span></div>
              <p className="text-gray-400 text-sm mb-6 flex-grow">{w.description}</p>
              {(w.fileName || w.filePath) && (<div className="mb-4 flex items-center space-x-2 text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded w-fit max-w-full"><Paperclip size={12} /><span className="truncate max-w-[150px]">{w.fileName || w.filePath}</span></div>)}
              <div className="flex gap-2">
                <button onClick={() => onRead(w)} className="flex-grow py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer"><span>Читать</span><BookOpen size={14} /></button>
                {isAdmin && (<button onClick={() => onDelete(sectionKey, i)} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer"><Trash2 size={16} /></button>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default function App() {
  const [published, setPublished] = useState<PublishedData>(() => getPublishedDataFromLocalStorage());
  const [about, setAbout] = useState<string>(() => readJSON<string>('aboutContent', ''));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => readJSON<boolean>('isAdmin', false));
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reader, setReader] = useState<Work | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocKey | null>(null);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem(GITHUB_TOKEN_KEY) || '');
  const [syncing, setSyncing] = useState(false);

  const aiWorks = published.aiWorks; const stories = published.personalStories; const books = published.personalBooks;
  const hasAny = aiWorks.length > 0 || stories.length > 0 || books.length > 0;

  useEffect(() => { fetchPublishedData().then((data) => { setPublished(data); persistPublishedData(data); }); }, []);
  useEffect(() => { persistPublishedData(published); }, [published]);
  useEffect(() => { writeJSON('aboutContent', about); }, [about]);
  useEffect(() => { writeJSON('isAdmin', isAdmin); }, [isAdmin]);

  const checkPassword = async (): Promise<boolean> => {
    const entered = prompt('Введите пароль автора:');
    if (entered === null) return false;
    const cfg = await fetchAuthConfig();
    if (!cfg) { alert('Не удалось загрузить данные входа. Попробуйте позже.'); return false; }
    if (await verifyAuthorPassword(entered)) return true;
    alert('Неверный пароль'); return false;
  };

  const heroUrl = `${getBase()}hero-custom.jpg`.replace(/\/\//g, '/');

  const setSection = (section: SectionKey, updater: (prev: Work[]) => Work[]) => {
    setPublished((prev) => ({ ...prev, [section]: updater(prev[section]) }));
  };

  const configureGithubToken = () => {
    const token = prompt('Введите GitHub PAT с доступом Contents: Read and Write.\nТокен сохранится только в этом браузере.', githubToken);
    if (token === null) return;
    const trimmed = token.trim();
    if (!trimmed) { localStorage.removeItem(GITHUB_TOKEN_KEY); setGithubToken(''); alert('Токен удалён.'); return; }
    localStorage.setItem(GITHUB_TOKEN_KEY, trimmed); setGithubToken(trimmed); alert('Токен сохранён.');
  };

  const resetDatabase = async () => {
    if (!githubToken) { alert('Сначала настройте токен GitHub.'); return; }
    if (!confirm('Очистить базу данных от кракозябр и дубликатов?\nОстанется только рассказ «Мир Разломанного Зеркала».')) return;
    setSyncing(true);
    try {
      await githubPutFile(PUBLIC_DATA_PATH, utf8_to_b64(JSON.stringify(DEFAULT_PUBLISHED_DATA, null, 2)), githubToken, 'Reset works database to fix encoding');
      setPublished(DEFAULT_PUBLISHED_DATA);
      persistPublishedData(DEFAULT_PUBLISHED_DATA);
      alert('База данных очищена! Подождите 1-2 минуты для пересборки сайта.');
    } catch (e: any) { alert(`Ошибка: ${e?.message}`); }
    finally { setSyncing(false); }
  };

  const createWork = async (section: SectionKey, title: string, description: string, file: File | null) => {
    if (!githubToken) {
      const localId = `work-${Date.now()}`;
      if (file) await saveFile(localId, file);
      setSection(section, (prev) => [{ id: localId, title, description, date: new Date().toLocaleDateString('ru-RU'), fileName: file?.name, fileType: file?.type } as Work, ...prev]);
      alert('Сохранено локально. Настройте токен для публичной публикации.'); return;
    }
    if (!file) { alert('Для публикации нужен файл.'); return; }
    setSyncing(true);
    try {
      const ext = file.name.lastIndexOf('.') >= 0 ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '.docx';
      const safeName = `${Date.now()}-${(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'work')}${ext}`;
      const work: Work = { id: `pub-${Date.now()}`, title, description, date: new Date().toLocaleDateString('ru-RU'), fileName: file.name, fileType: file.type, filePath: safeName };
      const remoteData = await loadRemotePublishedDataForEdit(githubToken);
      const nextData: PublishedData = { ...remoteData, [section]: [work, ...(remoteData[section] || [])] };
      await githubPutFile(`public/library/${safeName}`, await fileToBase64(file), githubToken, `Publish: ${safeName}`);
      await githubPutFile(PUBLIC_DATA_PATH, utf8_to_b64(JSON.stringify(nextData, null, 2)), githubToken, 'Update works database');
      setPublished(nextData); alert('Опубликовано! Через 30-90 сек сайт обновится.');
    } catch (e: any) { alert(`Ошибка: ${e?.message}`); } finally { setSyncing(false); }
  };

  const deleteWork = async (section: SectionKey, index: number) => {
    if (!confirm('Удалить?')) return;
    const work = published[section][index];
    if (githubToken && work.filePath) {
      setSyncing(true);
      try {
        const remoteData = await loadRemotePublishedDataForEdit(githubToken);
        const nextData: PublishedData = { ...remoteData, [section]: remoteData[section].filter((_, i) => i !== index) };
        await githubDeleteFile(`public/library/${work.filePath}`, githubToken, `Delete: ${work.filePath}`);
        await githubPutFile(PUBLIC_DATA_PATH, utf8_to_b64(JSON.stringify(nextData, null, 2)), githubToken, 'Remove work');
        setPublished(nextData); alert('Удалено.');
      } catch (e: any) { alert(`Ошибка: ${e?.message}`); } finally { setSyncing(false); }
      return;
    }
    await deleteStoredFile(work.id);
    setSection(section, (prev) => prev.filter((_, i) => i !== index));
  };

  const navLinks = useMemo(() => [
    { href: '#', label: 'Главная' },
    ...(aiWorks.length > 0 || isAdmin ? [{ href: '#ai-stories', label: 'ИИ-Истории' }] : []),
    ...(stories.length > 0 || isAdmin ? [{ href: '#my-stories', label: 'Рассказы' }] : []),
    ...(books.length > 0 || isAdmin ? [{ href: '#my-books', label: 'Книги' }] : []),
    { href: '#contact', label: 'Контакты' },
  ], [aiWorks.length, stories.length, books.length, isAdmin]);

  return (
    <div className="min-h-screen bg-stone-900 selection:bg-indigo-500 selection:text-white">
      <nav className="sticky top-0 z-40 bg-stone-900/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-16"><div className="flex items-center space-x-2 cursor-pointer group" onClick={() => { setAboutOpen(o => !o); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><BookOpen size={24} className="text-indigo-400 group-hover:text-white transition-colors" /><span className="font-bold text-white group-hover:text-indigo-300 transition-colors">Козлов Константин</span></div><div className="hidden md:flex space-x-8 text-sm font-medium">{navLinks.map(l => <a key={l.label} href={l.href} className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer">{l.label}</a>)}</div><button className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg cursor-pointer" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button></div></div>
        {menuOpen && <div className="md:hidden bg-stone-900 border-t border-white/5"><div className="px-2 pt-2 pb-3 space-y-1">{navLinks.map(l => <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md cursor-pointer">{l.label}</a>)}</div></div>}
      </nav>

      <main>
        <AnimatePresence>{aboutOpen && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-indigo-950 text-white overflow-hidden border-b border-indigo-500/20"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><div className="flex justify-between items-start mb-12"><div className="flex items-center space-x-4"><div className="p-3 bg-indigo-600 rounded-xl"><User size={24} /></div><h2 className="text-3xl font-bold">О себе</h2></div><button onClick={() => setAboutOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"><X size={28} /></button></div><div className="max-w-3xl mx-auto">{isAdmin ? (<div className="space-y-6"><textarea id="about-textarea" defaultValue={about} className="w-full h-64 px-4 py-3 bg-white/5 border border-indigo-500/30 rounded-xl text-gray-200 resize-none text-lg" placeholder="Расскажите о себе..." /><button onClick={() => { const el = document.getElementById('about-textarea') as HTMLTextAreaElement | null; if (el) { setAbout(el.value); alert('Сохранено!'); } }} className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer"><Save size={20} /><span>Сохранить</span></button></div>) : (<div className="space-y-6 text-gray-300 text-lg leading-relaxed font-light">{about ? about.split('\n').map((p, i) => <p key={i}>{p}</p>) : <p className="italic text-gray-500">Информация будет добавлена.</p>}</div>)}</div></div></motion.div>)}</AnimatePresence>

        <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden"><div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${heroUrl}')` }}><div className="absolute inset-0 bg-black/40" /></div><div className="relative z-10 text-center px-4 max-w-4xl"><h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Литературное хранилище</h1><div className="flex flex-wrap items-center justify-center gap-4">{(aiWorks.length > 0 || isAdmin) && <a href="#ai-stories" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer">ИИ-истории</a>}{(stories.length > 0 || isAdmin) && <a href="#my-stories" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold cursor-pointer">Рассказы</a>}{(books.length > 0 || isAdmin) && <a href="#my-books" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold cursor-pointer">Книги</a>}</div></div><motion.a href="#ai-stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white animate-bounce cursor-pointer"><ChevronDown size={32} /></motion.a></section>

        {syncing && <div className="sticky top-16 z-30 px-4 py-3 bg-amber-500/10 border-y border-amber-400/20 text-amber-200 text-sm text-center">Синхронизация с GitHub...</div>}

        <WorksSection id="ai-stories" title="ИИ-истории" icon={<Cpu size={28} />} works={aiWorks} isAdmin={isAdmin} publishReady={Boolean(githubToken)} sectionKey="aiWorks" onCreate={createWork} onDelete={deleteWork} onRead={setReader} />
        <WorksSection id="my-stories" title="Мои собственные рассказы" icon={<BookText size={28} />} works={stories} isAdmin={isAdmin} publishReady={Boolean(githubToken)} sectionKey="personalStories" onCreate={createWork} onDelete={deleteWork} onRead={setReader} />
        <WorksSection id="my-books" title="Мои собственные книги" icon={<LibraryBig size={28} />} works={books} isAdmin={isAdmin} publishReady={Boolean(githubToken)} sectionKey="personalBooks" onCreate={createWork} onDelete={deleteWork} onRead={setReader} />

        <section id="contact" className="py-24 bg-stone-50 scroll-mt-16"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="bg-white rounded-3xl shadow-xl overflow-hidden"><div className="grid grid-cols-1 lg:grid-cols-2"><div className="p-12 lg:p-16 bg-indigo-900 text-white"><h2 className="text-4xl font-serif font-bold mb-6">Связаться со мной</h2><p className="text-indigo-200 mb-12 text-lg">Буду рад вашему сообщению.</p><div className="space-y-8"><div className="flex items-center space-x-6"><div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center text-indigo-300"><Mail size={22} /></div><div><h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Email</h4><p className="text-xl break-all">kostya.kozlov280.dmit@gmail.com</p></div></div><a href="https://t.me/kkmrdr" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-6 group hover:bg-indigo-800/50 p-2 -m-2 rounded-xl cursor-pointer"><div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all"><Send size={22} /></div><div><h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Telegram</h4><p className="text-xl">@kkmrdr</p></div></a></div></div><div className="p-12 lg:p-16"><form className="space-y-6" onSubmit={e => {
          e.preventDefault();
          if (!consentPrivacy) return;
          const fd = new FormData(e.currentTarget);
          const now = new Date();
          const dateStr = now.toLocaleDateString('ru-RU');
          const timeStr = now.toLocaleTimeString('ru-RU');
          const bodyLines = [
            `Имя: ${fd.get('name') || ''}`,
            `Email: ${fd.get('email') || ''}`,
            '',
            String(fd.get('message') || ''),
            '',
            '---',
            'Согласие на обработку ПДн: Да',
            `Согласие на рекламную рассылку: ${consentMarketing ? 'Да' : 'Нет'}`,
            `Дата отправки: ${dateStr}`,
            `Время отправки: ${timeStr}`,
          ].join('\n');
          window.location.href = `mailto:kostya.kozlov280.dmit@gmail.com?subject=${encodeURIComponent(String(fd.get('subject') || 'Сообщение'))}&body=${encodeURIComponent(bodyLines)}`;
        }}><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-2">Имя</label><input name="name" placeholder="Иван Иванов" className="w-full px-4 py-3 rounded-lg border border-gray-200" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input name="email" type="email" placeholder="ivan@example.com" className="w-full px-4 py-3 rounded-lg border border-gray-200" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Тема</label><input name="subject" placeholder="Общий запрос" className="w-full px-4 py-3 rounded-lg border border-gray-200" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Сообщение</label><textarea name="message" rows={5} placeholder="Ваше сообщение..." className="w-full px-4 py-3 rounded-lg border border-gray-200 resize-none" /></div>
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3">
              <input
                id="consent-privacy"
                type="checkbox"
                checked={consentPrivacy}
                onChange={e => setConsentPrivacy(e.target.checked)}
                aria-labelledby="consent-privacy-label"
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-indigo-600 cursor-pointer"
              />
              <div id="consent-privacy-label" className="text-sm text-gray-700 leading-relaxed select-none">
                <span onClick={() => setConsentPrivacy(v => !v)} className="cursor-pointer">Я ознакомился(ась) с </span>
                <button
                  type="button"
                  onClick={() => setLegalDoc('privacy')}
                  className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium cursor-pointer"
                >
                  Политикой конфиденциальности
                </button>
                <span onClick={() => setConsentPrivacy(v => !v)} className="cursor-pointer"> и даю </span>
                <button
                  type="button"
                  onClick={() => setLegalDoc('consentPd')}
                  className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium cursor-pointer"
                >
                  согласие на обработку моих персональных данных
                </button>
                <span onClick={() => setConsentPrivacy(v => !v)} className="cursor-pointer">.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="consent-marketing"
                type="checkbox"
                checked={consentMarketing}
                onChange={e => setConsentMarketing(e.target.checked)}
                aria-labelledby="consent-marketing-label"
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-indigo-600 cursor-pointer"
              />
              <div id="consent-marketing-label" className="text-sm text-gray-700 leading-relaxed select-none">
                <span onClick={() => setConsentMarketing(v => !v)} className="cursor-pointer">Я даю согласие на получение </span>
                <button
                  type="button"
                  onClick={() => setLegalDoc('consentMarketing')}
                  className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium cursor-pointer"
                >
                  рекламно-информационных материалов
                </button>
                <span onClick={() => setConsentMarketing(v => !v)} className="cursor-pointer">.</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed pt-1">
              Нажимая кнопку отправки, вы подтверждаете достоверность предоставленных данных.
            </p>
          </div>

          <button
            type="submit"
            disabled={!consentPrivacy}
            className={`w-full py-4 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all disabled:cursor-not-allowed! ${
              consentPrivacy
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-lg shadow-indigo-600/20'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={18} />
            <span>Отправить сообщение</span>
          </button>
        </form></div></div></div></div></section>
      </main>

      <footer className="bg-white border-t border-gray-100 pt-16 pb-8"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"><div className={(hasAny || isAdmin) ? 'col-span-1 md:col-span-2' : 'col-span-1 md:col-span-3'}><div className="flex items-center space-x-2 mb-6"><BookOpen className="h-8 w-8 text-indigo-600" /><span className="text-2xl font-serif font-bold text-indigo-900">Литературное хранилище</span></div><p className="text-gray-500 max-w-sm mb-6">Персональное хранилище литературных трудов и ИИ-экспериментов.</p></div>{(hasAny || isAdmin) && <div><h4 className="text-gray-900 font-bold mb-6">Навигация</h4><ul className="space-y-4">{navLinks.map(l => <li key={l.href}><a href={l.href} className="text-gray-500 hover:text-indigo-600 cursor-pointer">{l.label}</a></li>)}</ul></div>}<div><h4 className="text-gray-900 font-bold mb-6">Правовая информация</h4><ul className="space-y-4"><li><button type="button" onClick={() => setLegalDoc('privacy')} className="text-left text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer">Политика конфиденциальности</button></li><li><button type="button" onClick={() => setLegalDoc('consentPd')} className="text-left text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer">Согласие на обработку персональных данных</button></li><li><button type="button" onClick={() => setLegalDoc('consentMarketing')} className="text-left text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer">Согласие на получение рекламно-информационных материалов</button></li></ul></div></div>
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4"><div className="flex items-center space-x-3 flex-wrap justify-center gap-y-2">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Козлов Константин</p>
          {isAdmin && <button onClick={configureGithubToken} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold flex items-center gap-1 cursor-pointer border border-indigo-100"><Settings2 size={14} /><span>{githubToken ? 'Токен настроен' : 'Настроить токен GitHub'}</span></button>}
          {isAdmin && githubToken && <button onClick={resetDatabase} className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full text-sm font-bold flex items-center gap-1 cursor-pointer border border-orange-200"><RefreshCw size={14} /><span>Исправить базу данных</span></button>}
          {isAdmin ? (<div className="flex items-center space-x-2"><button onClick={async () => { if (!githubToken) { alert('Сначала настройте токен GitHub.'); return; } const np = prompt('Новый пароль:'); if (!np) return; try { const salt = randomSalt(); const passwordHash = await sha256Hex(`${salt}:${np}`); await githubPutFile(PUBLIC_AUTH_PATH, utf8_to_b64(JSON.stringify({ salt, passwordHash, algorithm: 'SHA-256(salt:password)' }, null, 2)), githubToken, 'Update author password hash'); cachedAuthConfig = { salt, passwordHash }; alert('Пароль изменен! Сайт обновится через 30-90 сек.'); } catch (e: any) { alert(`Ошибка: ${e?.message}`); } }} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-sm font-bold flex items-center gap-1 cursor-pointer"><KeyRound size={14} /><span>Сменить пароль</span></button><button onClick={() => setIsAdmin(false)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full flex items-center space-x-2 text-sm font-bold border border-red-500/20 cursor-pointer"><LogOut size={16} /><span>Выход</span></button></div>) : (<button onClick={async () => { if (await checkPassword()) setIsAdmin(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center space-x-2 text-sm font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"><LogIn size={16} /><span>Вход для автора</span></button>)}
        </div><p className="text-gray-400 text-sm flex items-center">Сделано с <Heart size={14} className="mx-1 text-red-400 fill-current" /> для любителей литературы.</p></div></div></footer>

      <ReaderModal work={reader} onClose={() => setReader(null)} />
      <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
