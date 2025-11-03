
const API = {
  users: 'https://jsonplaceholder.typicode.com/users',
  todos: 'https://jsonplaceholder.typicode.com/todos',
  posts: 'https://jsonplaceholder.typicode.com/posts',
  comments: 'https://jsonplaceholder.typicode.com/comments'
};

const LS_USERS = 'besheki_custom_users_v1';
const LS_TODOS = 'besheki_custom_todos_v1';

const NAV_LABELS = {users:'Пользователи', todos:'Todos', posts:'Посты', comments:'Комменты'};

// Helpers
function el(tag, opts = {}, ...children){
  const e = document.createElement(tag);
  if(opts.class) e.className = opts.class;
  if(opts.html) e.innerHTML = opts.html;
  if(opts.attrs) for(const k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
  if(opts.on) for(const k in opts.on) e.addEventListener(k, opts.on[k]);
  for(const c of children) if(c) e.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
const qs = (q, b=document)=>b.querySelector(q);
const qsa = (q, b=document)=>Array.from(b.querySelectorAll(q));
function debounce(fn, wait=350){let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a), wait);};}

const cache = {};
async function fetchOnce(url){ if(cache[url]) return cache[url]; const r = await fetch(url); const j = await r.json(); cache[url]=j; return j; }
function loadLS(key, fallback){try{const s=localStorage.getItem(key);return s?JSON.parse(s):fallback;}catch(e){return fallback}}
function saveLS(key,val){localStorage.setItem(key,JSON.stringify(val))}

const state = {users:[], todos:[], posts:[], comments:[], search:''};

async function loadData(){
  const [users,todos,posts,comments] = await Promise.all([
    fetchOnce(API.users), fetchOnce(API.todos), fetchOnce(API.posts), fetchOnce(API.comments)
  ]);
  state.users = [...loadLS(LS_USERS,[]), ...users];
  state.todos = [...loadLS(LS_TODOS,[]), ...todos];
  state.posts = posts; state.comments = comments;
}

function parseHash(h){ return (h||'').split('#').filter(Boolean); }
function goHash(...parts){ location.hash = parts.join('#'); }

function Breadcrumbs(parts){
  const wrap = el('div',{class:'breadcrumbs card'});
  if(!parts || parts.length===0){ wrap.appendChild(el('div',{class:'small'},'Главная')); return wrap; }
  const fragment = el('div',{});
  parts.forEach((p,i)=>{
    const isLast = i===parts.length-1;
    const text = NAV_LABELS[p] || p;
    if(isLast) fragment.appendChild(el('span',{class:'kv'}, el('span',{class:'tag'},text)));
    else fragment.appendChild(el('a',{class:'linkish', on:{click:()=>goHash(...parts.slice(0,i+1))}}, text+' » '));
  });
  wrap.appendChild(fragment);
  return wrap;
}

function headerView(){
  const header = el('div',{class:'header'});
  const brand = el('div',{class:'brand'}, el('div',{class:'logo'}, el('img',{attrs:{src:'photo2.jpg',alt:'logo'}})), el('div',{class:'h-text'}, el('div',{class:'h-title'},'ЗАО "Бещеки"'), el('div',{class:'h-sub'},'Инновации и доверие')));
  const nav = el('nav',{class:'nav'},
    el('a',{on:{click:()=>renderClassic('home')},class: location.hash===''? 'active':''}, 'Главная'),
    el('a',{on:{click:()=>renderClassic('about')}}, 'О нас'),
    el('a',{on:{click:()=>renderClassic('contacts')}}, 'Контакты'),
    el('a',{on:{click:()=>renderClassic('req')}}, 'Реквизиты')
  );
  const controls = el('div',{class:'controls'});
  const search = el('input',{class:'search',attrs:{placeholder:'Поиск по SPA (Users/Todos/Posts/Comments)'}});
  search.value = state.search||'';
  search.addEventListener('input', debounce((e)=>{ state.search = e.target.value.trim(); renderSPAView(); },350));
  const spaBtn = el('button',{class:'btn',on:{click:()=>goHash('users')}}, 'Перейти к данным');
  controls.append(search, spaBtn);
  header.append(brand, nav, controls);
  return {header,searchEl:search};
}

// Classic pages
function renderClassic(page){ const app = qs('#app'); app.innerHTML = ''; const shell = el('div',{class:'app-shell'}); const {header} = headerView(); shell.appendChild(header);
  if(page==='home'){
    shell.appendChild(el('div',{class:'hero card'}, el('div',{class:'left'}, el('h1',{},'ЗАО "Бещеки" — Надёжный партнёр'), el('p',{},'Современные решения и персональный подход.')), el('div',{class:'photos'}, el('img',{class:'photo-thumb', attrs:{src:'photo2.svg'}}), el('img',{class:'photo-thumb', attrs:{src:'photo2.jpg'}}))));
    shell.appendChild(el('div',{class:'card'}, el('h3',{},'Наши разделы'), el('div',{class:'list'}, el('div',{class:'item'}, el('div',{class:'title'}, 'Пользователи (SPA) — демонстрация клиентов'), el('div',{class:'small'}, 'Переход в раздел: '), el('a',{class:'linkish',on:{click:()=>goHash('users')}}, '#users')))));
  } else if(page==='about'){
    shell.appendChild(el('div',{class:'card'}, el('h2',{},'О компании'), el('p',{}, 'ЗАО "Бещеки" — компания, работающая в сфере технологий и сервиса. Мы создаём решения, которые помогают нахуй не нужному бизнесу.')));
  } else if(page==='contacts'){
    shell.appendChild(el('div',{class:'card'}, el('h2',{},'Контакты'), el('p',{}, 'Email: info@zaebalsa.com'), el('p',{}, 'Телефон: +375 (29) 1235789')));
  } else if(page==='req'){
    shell.appendChild(el('div',{class:'card'}, el('h2',{},'Реквизиты'), el('pre',{}, 'ЗАО "Бещеки"\nИНН: 1212121212\nОГРН: 1212121212')));
  }
  shell.appendChild(el('div',{class:'footer-note'}, 'Классический сайт + SPA-демо. Для просмотра живых данных используйте раздел SPA.'));
  app.appendChild(shell);
}

// SPA views
function UsersView(parts){ const wrap = el('div'); wrap.appendChild(Breadcrumbs(parts)); wrap.appendChild(el('div',{class:'card'}, el('div',{class:'title'}, 'Список пользователей'), el('div',{class:'small'}, 'Можно добавить/удалить пользователя')));
  const list = el('div',{class:'list'}); const q = state.search.toLowerCase(); const users = state.users.filter(u=>{ if(!q) return true; return (u.name&&u.name.toLowerCase().includes(q)) || (u.email&&u.email.toLowerCase().includes(q)); }); if(users.length===0) list.append(el('div',{class:'empty'},'Ничего не найдено'));
  users.forEach(u=>{ const item = el('div',{class:'item'}); const left = el('div',{}, el('div',{class:'title'},u.name||'—'), el('div',{class:'meta'}, u.email||'—')); const right = el('div',{}, el('div',{class:'controls-row'}, el('a',{class:'linkish',on:{click:()=>goHash('users','todos',String(u.id))}}, 'Todos'), el('a',{class:'linkish',on:{click:()=>goHash('users','posts',String(u.id))}}, 'Posts'), el('a',{class:'linkish',on:{click:()=>deleteUser(u.id, renderSPAView)}}, 'Удалить'))); item.append(left,right); list.appendChild(item); });
  // add form
  const form = el('div',{class:'card'}, el('div',{class:'small'}, 'Добавить пользователя'), el('input',{class:'input',attrs:{placeholder:'Имя',id:'new_name'}}), el('input',{class:'input',attrs:{placeholder:'Email',id:'new_email'}}), el('div',{class:'form-row'}, el('button',{class:'btn',on:{click:()=>addUser(renderSPAView)}}, 'Добавить')));
  wrap.append(form, list); return wrap; }

function TodosView(parts){ const wrap = el('div'); wrap.appendChild(Breadcrumbs(parts)); wrap.appendChild(el('div',{class:'card'}, el('div',{class:'title'}, 'Todos')));
  const userId = parts[2] ? Number(parts[2]) : null; const q = state.search.toLowerCase(); let todos = state.todos.slice(); if(userId) todos = todos.filter(t=>t.userId===userId); todos = todos.filter(t=>!q || (t.title && t.title.toLowerCase().includes(q)));
  const list = el('div',{class:'list'}); if(todos.length===0) list.append(el('div',{class:'empty'},'Нет тудушек'));
  todos.slice(0,200).forEach(t=>{ list.appendChild(el('div',{class:'item'}, el('div',{}, el('div',{class:'title'}, t.title), el('div',{class:'meta'}, t.completed? 'Выполнено' : 'В процессе')), el('div',{}, el('div',{class:'small'}, `userId: ${t.userId}`)))); });
  if(userId){ const form = el('div',{class:'card'}, el('div',{class:'small'}, 'Добавить todo для userId: '+userId), el('input',{class:'input',attrs:{placeholder:'Title',id:'todo_title'}}), el('div',{class:'form-row'}, el('button',{class:'btn',on:{click:()=>addTodoForUser(userId)}}, 'Добавить'))); wrap.append(form, list); } else wrap.append(list);
  return wrap; }

function PostsView(parts){ const wrap = el('div'); wrap.appendChild(Breadcrumbs(parts)); wrap.appendChild(el('div',{class:'card'}, el('div',{class:'title'}, 'Посты')));
  const userId = parts[2] ? Number(parts[2]) : null; const q = state.search.toLowerCase(); let posts = state.posts.slice(); if(userId) posts = posts.filter(p=>p.userId===userId); posts = posts.filter(p=>!q || (p.title && p.title.toLowerCase().includes(q)) || (p.body && p.body.toLowerCase().includes(q)));
  const list = el('div',{class:'list'}); if(posts.length===0) list.append(el('div',{class:'empty'},'Нет постов'));
  posts.slice(0,200).forEach(p=>{ list.appendChild(el('div',{class:'item'}, el('div',{}, el('div',{class:'title'}, p.title), el('div',{class:'meta'}, p.body.slice(0,140)+'...')), el('div',{}, el('a',{class:'linkish', on:{click:()=>goHash('users','posts','comments',String(p.id))}}, 'Комменты')))); });
  wrap.append(list); return wrap; }

function CommentsView(parts){ const wrap = el('div'); wrap.appendChild(Breadcrumbs(parts)); const pId = parts[3] ? Number(parts[3]) : (parts[2] && parts[2]!=='posts' ? Number(parts[2]) : null); const q = state.search.toLowerCase(); let comments = state.comments.slice(); if(pId) comments = comments.filter(c=>c.postId===pId); comments = comments.filter(c=>!q || (c.name && c.name.toLowerCase().includes(q)) || (c.body && c.body.toLowerCase().includes(q)));
  const list = el('div',{class:'list'}); if(comments.length===0) list.append(el('div',{class:'empty'},'Нет комментариев'));
  comments.slice(0,200).forEach(c=>{ list.appendChild(el('div',{class:'item'}, el('div',{}, el('div',{class:'title'}, c.name), el('div',{class:'meta'}, c.body)), el('div',{}, el('div',{class:'small'},`email: ${c.email}`)))); });
  wrap.append(list); return wrap; }

// Add/delete
function openAddUserModal(cb){ const overlay = el('div',{class:'card'}, el('div',{class:'title'},'Добавить пользователя'), el('div',{}, el('input',{class:'input',attrs:{placeholder:'Имя',id:'new_name'}}), el('input',{class:'input',attrs:{placeholder:'Email',id:'new_email'}}), el('div',{class:'form-row'}, el('button', 'Добавить'), el('button',{class:'btn',on:{click:()=>renderSPAView()}}, 'Отмена')))); const app = qs('#app'); app.innerHTML=''; app.appendChild(overlay); }
function addUser(cb){ const name = qs('#new_name').value.trim(); const email = qs('#new_email').value.trim(); if(!name || !email){alert('Введите имя и email');return} const custom = loadLS(LS_USERS,[]); const newId = Date.now(); const u = {id:newId,name,email}; custom.unshift(u); saveLS(LS_USERS,custom); loadData().then(cb); }
function deleteUser(id,cb){ const custom = loadLS(LS_USERS,[]).filter(u=>u.id!==id); saveLS(LS_USERS,custom); loadData().then(cb); }
function addTodoForUser(userId){ const title = qs('#todo_title').value.trim(); if(!title){alert('Введите title');return} const custom = loadLS(LS_TODOS,[]); const newTodo = {userId, id:Date.now(), title, completed:false}; custom.unshift(newTodo); saveLS(LS_TODOS,custom); loadData().then(renderSPAView); }

// Render SPA container
function renderAppShell(content){ const app = qs('#app'); app.innerHTML=''; const shell = el('div',{class:'app-shell'}); const {header} = headerView(); shell.appendChild(header); shell.appendChild(content); shell.appendChild(el('div',{class:'footer-note'}, 'Данные: jsonplaceholder.typicode.com. Созданные данные — localStorage.'));
  app.appendChild(shell);
}

function renderSPAView(){ const parts = parseHash(location.hash).length?parseHash(location.hash):['users']; const primary = parts[0]; let view; if(primary==='users' && parts.length===1) view = UsersView(parts); else if(primary==='users' && parts[1]==='todos') view = TodosView(parts); else if(primary==='users' && parts[1]==='posts' && parts.length<=3) view = PostsView(parts); else if(parts.includes('comments')) view = CommentsView(parts); else view = UsersView(parts); renderAppShell(view); }

// Initialisation
window.addEventListener('hashchange', ()=>renderSPAView());
(async function init(){ await loadData(); // default page — classic home
  if(!location.hash){ renderClassic('home'); }
  // quick navigate to SPA if hash contains users
  if(location.hash.includes('users')) renderSPAView();
})();

// expose some functions for navigation
window.renderClassic = renderClassic;
window.renderSPAView = renderSPAView;




