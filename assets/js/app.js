// Single-page app with smooth scroll
(function () {
  const copyrightYear = document.getElementById('copyright-year');
  copyrightYear.textContent = new Date().getFullYear();

  // Helpers
  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  }
  async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.text();
  }
  function renderMarkdown(md) {
    const html = marked.parse(md || '');
    return html;
  }

  // Smooth scroll handler
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || !href) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, null, href);
      }
    });
  });

  // Active nav on scroll
  const nav = document.getElementById('site-nav');
  const sections = ['home', 'about', 'people', 'research', 'publications', 'news', 'join', 'contact'];
  const navLinks = {};
  sections.forEach(s => {
    navLinks[s] = nav.querySelector(`a[data-route="${s}"]`);
  });

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    let current = 'home';
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section && section.offsetTop <= scrollPos) {
        current = id;
      }
    });
    Object.keys(navLinks).forEach(k => {
      if (navLinks[k]) {
        navLinks[k].classList.toggle('active', k === current);
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  // Load About
  async function loadAbout() {
    try {
      const md = await fetchText('content/about.md');
      document.getElementById('about-content').innerHTML = renderMarkdown(md);
    } catch (e) { console.error(e); }
  }

  // Load People
  async function loadPeople() {
    try {
      const data = await fetchJSON('content/people.json');
      const html = [];

      if (data.pi?.length) {
        html.push(`
          <section class="people-section">
            <div style="text-align:left; margin:16px 0; font-size:18px; font-weight:600; color:var(--primary);">PI/Founding Director</div>
            ${data.pi.map((pi, index) => {
              // Check if this is Gunasekaran Nallappan or Zhang Yuanyuan and add link to personal page
              const isGuna = pi.name && pi.name.toLowerCase().includes('gunasekaran');
              const isZyy = pi.name && (pi.name.includes('张圆圆') || pi.name.toLowerCase().includes('yuanyuan'));
              
              let nameHtml;
              if (isGuna) {
                nameHtml = `<a href="guna.html" target="_blank" class="person-name-link"><div class="name">${pi.name}</div></a>`;
              } else if (isZyy) {
                nameHtml = `<a href="zyy.html" target="_blank" class="person-name-link"><div class="name">${pi.name}</div></a>`;
              } else {
                nameHtml = `<div class="name">${pi.name}</div>`;
              }
              
              const cardHtml = `
            <div class="person-card" style="display:grid; grid-template-columns: 180px 1fr; gap:16px; margin-bottom:24px;">
              <img src="${pi.photo}" alt="${pi.name}">
              <div>
                ${nameHtml}
                ${isGuna ? `
                <div style="display:grid; grid-template-columns: auto auto; gap:24px; align-items:start; margin-bottom:12px;">
                  <div style="display:flex; flex-direction:column;">
                    <div class="meta" style="margin-bottom:4px;">应用数学博士</div>
                    <div class="meta" style="margin-bottom:4px;">副教授</div>
                  </div>
                  <div style="display:flex; flex-direction:column;">
                    <div class="meta" style="margin-bottom:4px;">IEEE成员</div>
                    <div class="meta" style="margin-bottom:4px;">《富兰克林研究所期刊》副主编</div>
                  </div>
                </div>
                ` : `<div class="meta">${pi.title} · ${pi.office || ''}</div>`}
                <p>${pi.bio || ''}</p>
                ${isGuna ? `
                <p>
                  <a href="${pi.email}" target="_blank">ORCID</a><br>
                  <a href="${pi.scholar}" target="_blank">Google Scholar</a>
                </p>
                ` : isZyy ? `
                <p>
                  <a href="mailto:${pi.email}">${pi.email}</a><br>
                  <a href="${pi.scholar}" target="_blank">BBGU</a>
                </p>
                ` : `<p><a href="mailto:${pi.email}">${pi.email}</a> ${pi.scholar && pi.scholar !== '#' ? ` · <a href="${pi.scholar}" target="_blank">Google Scholar</a>` : ''}</p>`}
              </div>
            </div>`;
              return index === 1 ? `<div style="text-align:left; margin:16px 0; font-size:18px; font-weight:600; color:var(--primary);">导师</div>${cardHtml}` : cardHtml;
            }).join('')
          }
          </section>`);
      }


      function renderGrid(title, list) {
        if (!list?.length) return '';
        return `
          <section class="people-section">
            <h3>${title}</h3>
            <div class="person-grid">
              ${list.map(p => `
                <div class="person-card">
                  <img src="${p.photo}" alt="${p.name}">
                  <div class="name">${p.name}</div>
                  <div class="meta">${p.title || p.degree || ''} · ${p.startYear || ''}</div>
                  <div class="muted">${p.area || ''}</div>
                </div>`).join('')}
            </div>
          </section>`;
      }

      html.push(renderGrid('研究人员 / 博士后', data.researchers));
      
      // Render students in A group with horizontal layout (3 per row)
      if (data.students?.length) {
        html.push(`
          <section class="people-section">
            <h3>团队成员</h3>
            <div style="text-align:left; margin:16px 0; font-size:18px; font-weight:600; color:var(--primary);">人工智能与复杂计算课题组</div>
            <div class="person-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px;">
        `);
        
        // Render existing students
        data.students.forEach(student => {
          html.push(`
              <div class="person-card">
                <img src="${student.photo}" alt="${student.name}">
                <div class="name">${student.name}</div>
                <div class="meta">${student.degree || ''} · ${student.startYear || ''}</div>
                <div class="muted">${student.area || ''}</div>
              </div>
          `);
        });
        
        // Add placeholder to complete the row of 4
        const placeholdersNeeded = 4 - (data.students.length % 4);
        if (placeholdersNeeded < 4) {
          for (let i = 0; i < placeholdersNeeded; i++) {
            html.push(`
              <div class="person-card" style="opacity: 0.6; border-style: dashed;">
                <img src="assets/img/avatar.svg" alt="待添加">
                <div class="name" style="color: var(--muted);">待添加</div>
                <div class="meta" style="color: var(--muted);">-</div>
                <div class="muted">-</div>
              </div>
            `);
          }
        }
        
        html.push(`
            </div>
        `);
        
        // Add autonomous driving group
        html.push(`
            <div style="text-align:left; margin:16px 0; font-size:18px; font-weight:600; color:var(--primary);">自动驾驶与智能控制课题组</div>
            <div class="person-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px;">
        `);
        
        // Render autonomous driving group members
        if (data.autonomousDriving?.length) {
          data.autonomousDriving.forEach(member => {
            html.push(`
              <div class="person-card">
                <img src="${member.photo}" alt="${member.name}">
                <div class="name">${member.name}</div>
                <div class="meta">${member.degree || ''} · ${member.startYear || ''}</div>
                <div class="muted">${member.area || ''}</div>
              </div>
            `);
          });
          
          // Add placeholders if needed to complete the row
          const placeholdersNeeded = 4 - (data.autonomousDriving.length % 4);
          if (placeholdersNeeded < 4) {
            for (let i = 0; i < placeholdersNeeded; i++) {
              html.push(`
                <div class="person-card" style="opacity: 0.6; border-style: dashed;">
                  <img src="assets/img/avatar.svg" alt="待添加">
                  <div class="name" style="color: var(--muted);">待添加</div>
                  <div class="meta" style="color: var(--muted);">-</div>
                  <div class="muted">-</div>
                </div>
              `);
            }
          }
        } else {
          // If no autonomous driving members, show 4 placeholders
          for (let i = 0; i < 4; i++) {
            html.push(`
              <div class="person-card" style="opacity: 0.6; border-style: dashed;">
                <img src="assets/img/avatar.svg" alt="待添加">
                <div class="name" style="color: var(--muted);">待添加</div>
                <div class="meta" style="color: var(--muted);">-</div>
                <div class="muted">-</div>
              </div>
            `);
          }
        }
        
        html.push(`
            </div>
        `);
        
        // Add automation simulation group
        html.push(`
            <div style="text-align:left; margin:16px 0; font-size:18px; font-weight:600; color:var(--primary);">自动化仿真与复杂电路课题组</div>
            <div class="person-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px;">
        `);
        
        // Render automation simulation group members
        if (data.automationSimulation?.length) {
          data.automationSimulation.forEach(member => {
            html.push(`
              <div class="person-card">
                <img src="${member.photo}" alt="${member.name}">
                <div class="name">${member.name}</div>
                <div class="meta">${member.degree || ''} · ${member.startYear || ''}</div>
                <div class="muted">${member.area || ''}</div>
              </div>
            `);
          });
          
          // Add placeholders if needed to complete the row
          const placeholdersNeeded = 4 - (data.automationSimulation.length % 4);
          if (placeholdersNeeded < 4) {
            for (let i = 0; i < placeholdersNeeded; i++) {
              html.push(`
                <div class="person-card" style="opacity: 0.6; border-style: dashed;">
                  <img src="assets/img/avatar.svg" alt="待添加">
                  <div class="name" style="color: var(--muted);">待添加</div>
                  <div class="meta" style="color: var(--muted);">-</div>
                  <div class="muted">-</div>
                </div>
              `);
            }
          }
        } else {
          // If no automation simulation members, show 4 placeholders
          for (let i = 0; i < 4; i++) {
            html.push(`
              <div class="person-card" style="opacity: 0.6; border-style: dashed;">
                <img src="assets/img/avatar.svg" alt="待添加">
                <div class="name" style="color: var(--muted);">待添加</div>
                <div class="meta" style="color: var(--muted);">-</div>
                <div class="muted">-</div>
              </div>
            `);
          }
        }
        
        html.push(`
            </div>
          </section>
        `);
      }

      if (data.alumni?.length) {
        html.push(`
          <section class="people-section">
            <h3>已毕业学生</h3>
            <ul class="news-list">
              ${data.alumni.map(a => `<li><span>${a.name}</span><span class="news-date">${a.year}</span><span class="muted">${a.destination || ''}</span></li>`).join('')}
            </ul>
          </section>`);
      }

      document.getElementById('people-content').innerHTML = html.join('');
    } catch (e) { console.error(e); }
  }

  // Load Research
  async function loadResearch() {
    try {
      const areas = await fetchJSON('content/research.json');
      const cards = areas.map(a => `
        <div class="card">
          <div class="muted">${a.icon || ''}</div>
          <h3>${a.title}</h3>
          <p class="muted">${a.summary}</p>
        </div>`).join('');
      document.getElementById('research-content').innerHTML = cards;
    } catch (e) { console.error(e); }
  }

  // Load Publications
  async function loadPublications() {
    try {
      const pubs = await fetchJSON('content/publications.json');
      let peopleNames = new Set();
      try {
        const people = await fetchJSON('content/people.json');
        ['pi', 'researchers', 'students'].forEach(k => (people[k] || []).forEach(p => peopleNames.add(p.name)));
      } catch (e) { }

      const years = [...new Set(pubs.map(p => p.year))].sort((a, b) => b - a);
      const types = [...new Set(pubs.map(p => p.type))];

      function boldLabMembers(authors) {
        let result = authors;
        peopleNames.forEach(name => {
          const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`\\b${esc}\\b`, 'g');
          result = result.replace(re, `<strong>${name}</strong>`);
        });
        return result;
      }

      function renderList(filterYear, filterType) {
        const list = pubs
          .filter(p => (!filterYear || p.year === Number(filterYear)) && (!filterType || p.type === filterType))
          .sort((a, b) => b.year - a.year);
        const items = list.map(p => `
          <li class="pub-item">
            <div>${boldLabMembers(p.authors)}. <strong>${p.title}</strong>. ${p.venue}, ${p.year}.</div>
            <div class="pub-links">
              ${p.links?.pdf ? `<a href="${p.links.pdf}" target="_blank">[PDF]</a>` : ''}
              ${p.links?.doi ? `<a href="${p.links.doi}" target="_blank">[DOI]</a>` : ''}
              ${p.links?.code ? `<a href="${p.links.code}" target="_blank">[代码]</a>` : ''}
            </div>
          </li>`).join('');
        document.getElementById('publications-content').innerHTML = `
          <div class="filters">
            <label>年份 <select id="filter-year"><option value="">全部</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}</select></label>
            <label>类型 <select id="filter-type"><option value="">全部</option>${types.map(t => `<option value="${t}">${t}</option>`).join('')}</select></label>
          </div>
          <ul class="pub-list">${items}</ul>`;
        const fy = document.getElementById('filter-year');
        const ft = document.getElementById('filter-type');
        fy.value = filterYear || '';
        ft.value = filterType || '';
        fy.onchange = () => renderList(fy.value, ft.value);
        ft.onchange = () => renderList(fy.value, ft.value);
      }

      renderList('', '');
    } catch (e) { console.error(e); }
  }

  // Load News
  async function loadNews() {
    try {
      const news = await fetchJSON('content/news.json');
      const list = news
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(n => `<li><div><strong>${n.title}</strong><div class="muted">${n.summary || ''}</div></div><span class="news-date">${n.date}</span></li>`)
        .join('');
      document.getElementById('news-content').innerHTML = `<ul class="news-list">${list}</ul>`;
    } catch (e) { console.error(e); }
  }

  // Load Join
  async function loadJoin() {
    try {
      const md = await fetchText('content/join.md');
      document.getElementById('join-content').innerHTML = renderMarkdown(md);
    } catch (e) { console.error(e); }
  }

  // Load Contact
  async function loadContact() {
    try {
      const md = await fetchText('content/contact.md');
      document.getElementById('contact-content').innerHTML = renderMarkdown(md);
    } catch (e) { console.error(e); }
  }

  // Hamburger menu
  const hamburger = document.querySelector('.hamburger');
  hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // Close menu on link click
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
    });
  });

  // Boot - load all sections
  Promise.all([
    loadAbout(),
    loadPeople(),
    loadResearch(),
    loadPublications(),
    loadNews(),
    loadJoin(),
    loadContact()
  ]).then(() => {
    // Handle initial hash
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  });
})();
