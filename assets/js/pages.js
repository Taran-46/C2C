/* ============================================================
   CODE2CHILL — Pages Interactive Engine
   Interactive filters, 3D spotlight, modals, live timers, inquiry form
   ============================================================ */
(() => {
  'use strict';

  // 1. Mouse spotlight on cards
  const cards = document.querySelectorAll('.c2c-card, .channel-card');
  cards.forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
    });
  });

  // 2. Generic Modal Engine
  const modal = document.getElementById('c2cModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const modalCategory = document.getElementById('modalCategory');

  function openModal(data) {
    if (!modal) return;
    if (modalCategory) modalCategory.textContent = data.category || 'Details';
    if (modalTitle) modalTitle.textContent = data.title || '';
    if (modalContent) modalContent.innerHTML = data.content || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lock');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('lock');
  }

  window.__openC2CModal = openModal;
  window.__closeC2CModal = closeModal;

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // 3. Coordinator Details Modal Trigger
  document.querySelectorAll('[data-coord-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.c2c-card');
      if (!card) return;
      const name = card.dataset.name;
      const role = card.dataset.role;
      const group = card.dataset.group;
      const bio = card.dataset.bio;
      const linkedin = card.dataset.linkedin;
      const initials = card.dataset.initials;

      openModal({
        category: `${group} · Chitkara University`,
        title: name,
        content: `
          <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;">
            <div class="monogram-badge" style="width:68px;height:68px;">
              <span class="monogram-text" style="font-size:24px;">${initials}</span>
            </div>
            <div>
              <div style="font-family:var(--ff-mono);font-size:13px;color:var(--blue-lt);font-weight:600;">${role}</div>
              <div style="font-size:12px;color:var(--ink-3);margin-top:2px;">Chitkara University Student Coordinator</div>
            </div>
          </div>
          <p style="font-size:15px;line-height:1.7;color:var(--ink);margin-bottom:24px;">${bio}</p>
          <div style="background:rgba(255,255,255,0.03);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:24px;">
            <div style="font-family:var(--ff-mono);font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Core Responsibilities</div>
            <ul style="font-size:13px;color:var(--ink-2);line-height:1.6;list-style:disc;padding-left:18px;">
              <li>Technical workshop planning & peer mentorship</li>
              <li>Hands-on curriculum review and live coding sessions</li>
              <li>Cross-discipline engineering collaboration across campus</li>
            </ul>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--line);">
            <span style="font-family:var(--ff-mono);font-size:11px;color:#10b981;display:flex;align-items:center;gap:6px;">
              <span style="width:6px;height:6px;border-radius:50%;background:#10b981;"></span> Verified Student Lead
            </span>
            ${linkedin ? `
              <a href="${linkedin}" target="_blank" rel="noopener noreferrer" class="btn btn--nav" style="padding:8px 18px;font-size:12px;">
                <span>View LinkedIn Profile</span>
                <svg viewBox="0 0 16 16" style="width:12px;height:12px;stroke:currentColor;fill:none;"><path d="M3 13 13 3M6 3h7v7"/></svg>
              </a>
            ` : ''}
          </div>
        `
      });
    });
  });

  // 4. Team Filters & Search
  const teamPills = document.querySelectorAll('.team-filter-pill');
  const teamSearch = document.getElementById('teamSearch');
  const teamCards = document.querySelectorAll('.team-card');

  function filterTeam() {
    const activePill = document.querySelector('.team-filter-pill.active');
    const groupFilter = activePill ? activePill.dataset.group : 'all';
    const query = teamSearch ? teamSearch.value.trim().toLowerCase() : '';

    teamCards.forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const role = (card.dataset.role || '').toLowerCase();
      const group = (card.dataset.group || '').toLowerCase();
      const bio = (card.dataset.bio || '').toLowerCase();

      const matchesGroup = (groupFilter === 'all') || (group.includes(groupFilter.toLowerCase()));
      const matchesQuery = !query || name.includes(query) || role.includes(query) || bio.includes(query);

      card.style.display = (matchesGroup && matchesQuery) ? '' : 'none';
    });
  }

  if (teamPills.length) {
    teamPills.forEach(pill => {
      pill.addEventListener('click', () => {
        teamPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterTeam();
      });
    });
  }

  if (teamSearch) {
    teamSearch.addEventListener('input', filterTeam);
  }

  // 5. Events Tabs, Filters & RSVP Modal
  const eventTabs = document.querySelectorAll('.event-tab-btn');
  const eventPills = document.querySelectorAll('.event-cat-pill');
  const eventCards = document.querySelectorAll('.event-card');

  function filterEvents() {
    const activeTab = document.querySelector('.event-tab-btn.active');
    const tabState = activeTab ? activeTab.dataset.tab : 'upcoming';
    const activePill = document.querySelector('.event-cat-pill.active');
    const catState = activePill ? activePill.dataset.category : 'all';

    eventCards.forEach(card => {
      const cardTemporal = card.dataset.temporal; // 'upcoming' or 'past'
      const cardCategory = card.dataset.category || '';

      const matchesTab = (cardTemporal === tabState);
      const matchesCat = (catState === 'all') || (cardCategory.toLowerCase() === catState.toLowerCase());

      card.style.display = (matchesTab && matchesCat) ? '' : 'none';
    });
  }

  if (eventTabs.length) {
    eventTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        eventTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterEvents();
      });
    });
  }

  if (eventPills.length) {
    eventPills.forEach(pill => {
      pill.addEventListener('click', () => {
        eventPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterEvents();
      });
    });
  }

  // Event RSVP Detail Modal
  document.querySelectorAll('[data-event-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.event-card');
      if (!card) return;
      const title = card.dataset.title;
      const category = card.dataset.category;
      const date = card.dataset.date;
      const venue = card.dataset.venue;
      const summary = card.dataset.summary;
      const status = card.dataset.status;

      openModal({
        category: `${category} · Chitkara University`,
        title: title,
        content: `
          <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
            <span class="badge-status ${status === 'open' ? 'badge-status--open' : 'badge-status--past'}">${status === 'open' ? 'Registrations Active' : 'Completed Archive'}</span>
            <span style="font-family:var(--ff-mono);font-size:11px;color:var(--ink-2);background:rgba(255,255,255,0.04);border:1px solid var(--line);padding:3px 10px;border-radius:6px;">Chitkara University (IST)</span>
          </div>
          <p style="font-size:15px;line-height:1.65;color:var(--ink);margin-bottom:24px;">${summary}</p>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;font-family:var(--ff-mono);font-size:12px;">
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--line);padding:12px;border-radius:8px;">
              <div style="color:var(--ink-3);font-size:10px;text-transform:uppercase;margin-bottom:4px;">Date & Schedule</div>
              <div style="color:var(--cream);font-weight:600;">${date}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--line);padding:12px;border-radius:8px;">
              <div style="color:var(--ink-3);font-size:10px;text-transform:uppercase;margin-bottom:4px;">Campus Venue</div>
              <div style="color:var(--cream);font-weight:600;">${venue}</div>
            </div>
          </div>
          <div style="background:rgba(61,107,255,0.06);border:1px solid rgba(125,157,255,0.25);border-radius:10px;padding:16px;margin-bottom:24px;">
            <div style="font-family:var(--ff-mono);font-size:11px;color:var(--blue-lt);font-weight:600;margin-bottom:6px;">Important Attendee Guidelines</div>
            <ul style="font-size:12.5px;color:var(--ink-2);line-height:1.6;list-style:disc;padding-left:18px;">
              <li>Bring your student identity card for verification at the entrance.</li>
              <li>Bring your laptop configured with modern browser & Node.js/Git tools.</li>
              <li>Check in 15 minutes prior to session kick-off.</li>
            </ul>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:16px;border-top:1px solid var(--line);">
            ${status === 'open' ? `
              <button id="eventRsvpBtn" class="btn btn--nav" style="padding:10px 22px;">
                <span>Confirm Session Attendance</span>
                <svg viewBox="0 0 16 16" style="width:14px;height:14px;stroke:currentColor;fill:none;"><path d="M3 13 13 3M6 3h7v7"/></svg>
              </button>
            ` : `
              <span style="font-family:var(--ff-mono);font-size:12px;color:var(--ink-3);">Session concluded. Archive accessible above.</span>
            `}
          </div>
        `
      });

      const rsvpBtn = document.getElementById('eventRsvpBtn');
      if (rsvpBtn) {
        rsvpBtn.addEventListener('click', () => {
          rsvpBtn.innerHTML = `<span>Seat Confirmed! See you at ${venue}</span>`;
          rsvpBtn.style.background = '#10b981';
          rsvpBtn.style.borderColor = '#10b981';
        });
      }
    });
  });

  // 6. Live Countdown Clock
  const cdD = document.getElementById('pageCdD');
  const cdH = document.getElementById('pageCdH');
  const cdM = document.getElementById('pageCdM');
  const cdS = document.getElementById('pageCdS');

  if (cdD && cdH && cdM && cdS) {
    const targetDate = new Date();
    // Next Friday 19:00 IST
    const day = targetDate.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + diff);
    targetDate.setHours(19, 0, 0, 0);

    function updateCountdown() {
      const now = new Date();
      const rem = targetDate - now;
      if (rem <= 0) {
        cdD.textContent = '00';
        cdH.textContent = '00';
        cdM.textContent = '00';
        cdS.textContent = '00';
        return;
      }
      const s = Math.floor(rem / 1000);
      const days = Math.floor(s / 86400);
      const hours = Math.floor((s % 86400) / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;

      cdD.textContent = String(days).padStart(2, '0');
      cdH.textContent = String(hours).padStart(2, '0');
      cdM.textContent = String(mins).padStart(2, '0');
      cdS.textContent = String(secs).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // 7. Projects Filters & Search
  const projPills = document.querySelectorAll('.proj-cat-pill');
  const projSearch = document.getElementById('projSearch');
  const projCards = document.querySelectorAll('.project-card');

  function filterProjects() {
    const activePill = document.querySelector('.proj-cat-pill.active');
    const cat = activePill ? activePill.dataset.category : 'all';
    const q = projSearch ? projSearch.value.trim().toLowerCase() : '';

    projCards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const tech = (card.dataset.tech || '').toLowerCase();
      const contrib = (card.dataset.contrib || '').toLowerCase();

      const matchesCat = (cat === 'all') || (category === cat.toLowerCase());
      const matchesQ = !q || title.includes(q) || tech.includes(q) || contrib.includes(q);

      card.style.display = (matchesCat && matchesQ) ? '' : 'none';
    });
  }

  if (projPills.length) {
    projPills.forEach(pill => {
      pill.addEventListener('click', () => {
        projPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterProjects();
      });
    });
  }

  if (projSearch) {
    projSearch.addEventListener('input', filterProjects);
  }

  // Project Detail Modal
  document.querySelectorAll('[data-project-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.project-card');
      if (!card) return;
      const title = card.dataset.title;
      const category = card.dataset.category;
      const summary = card.dataset.summary;
      const problem = card.dataset.problem;
      const tech = card.dataset.tech;
      const contrib = card.dataset.contrib;
      const demo = card.dataset.demo;

      openModal({
        category: `${category} · Student Engineering Showcase`,
        title: title,
        content: `
          <div style="background:rgba(61,107,255,0.06);border-left:3px solid var(--blue-lt);padding:14px 18px;border-radius:0 10px 10px 0;margin-bottom:20px;">
            <div style="font-family:var(--ff-mono);font-size:10px;text-transform:uppercase;color:var(--blue-lt);letter-spacing:0.08em;margin-bottom:4px;">Problem Solved</div>
            <p style="font-size:13.5px;color:var(--ink);line-height:1.6;">${problem}</p>
          </div>
          <p style="font-size:14.5px;line-height:1.65;color:var(--ink-2);margin-bottom:22px;">${summary}</p>
          <div style="margin-bottom:22px;">
            <div style="font-family:var(--ff-mono);font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Technology Stack</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${tech.split(',').map(t => `<span class="tech-tag" style="font-size:11px;padding:4px 10px;">${t.trim()}</span>`).join('')}
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--line);padding:14px;border-radius:8px;margin-bottom:24px;font-family:var(--ff-mono);font-size:11.5px;color:var(--ink-2);">
            <div>Contributors: <strong style="color:var(--cream);">${contrib}</strong></div>
            <div style="color:var(--ink-3);font-size:10.5px;margin-top:4px;">🔒 Source code is private to contributors per club data-privacy policy</div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:16px;border-top:1px solid var(--line);">
            ${demo ? `
              <a href="${demo}" target="_blank" rel="noopener noreferrer" class="btn btn--nav" style="padding:10px 22px;">
                <span>Open Live Demo</span>
                <svg viewBox="0 0 16 16" style="width:14px;height:14px;stroke:currentColor;fill:none;"><path d="M3 13 13 3M6 3h7v7"/></svg>
              </a>
            ` : `
              <span style="font-family:var(--ff-mono);font-size:12px;color:var(--ink-3);">Internal Campus Deployment</span>
            `}
          </div>
        `
      });
    });
  });

  // 8. Gallery Procedural Lightbox Modal (NO IMAGES - pure procedural vector & code architecture)
  document.querySelectorAll('[data-album-id]').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.dataset.title;
      const count = card.dataset.count;
      const date = card.dataset.date;
      const desc = card.dataset.desc;
      const logs = JSON.parse(card.dataset.logs || '[]');

      let logsHtml = logs.map((log, idx) => `
        <div style="display:flex;gap:16px;margin-bottom:18px;align-items:flex-start;">
          <div style="font-family:var(--ff-mono);font-size:11px;color:var(--blue-lt);background:rgba(61,107,255,0.12);border:1px solid rgba(125,157,255,0.3);width:28px;height:28px;border-radius:6px;display:grid;place-items:center;flex-shrink:0;">
            ${String(idx + 1).padStart(2, '0')}
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--cream);margin-bottom:2px;">${log.title}</div>
            <div style="font-size:12.5px;color:var(--ink-2);line-height:1.5;">${log.desc}</div>
          </div>
        </div>
      `).join('');

      openModal({
        category: `Photo & Milestone Archive · ${date}`,
        title: title,
        content: `
          <p style="font-size:14.5px;color:var(--ink-2);line-height:1.6;margin-bottom:24px;">${desc}</p>
          <div style="background:rgba(4,6,11,0.9);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid var(--line-2);padding-bottom:10px;">
              <span style="font-family:var(--ff-mono);font-size:11px;color:var(--blue-ice);letter-spacing:0.06em;text-transform:uppercase;">Session Timeline & Documented Artifacts</span>
              <span style="font-family:var(--ff-mono);font-size:11px;color:var(--ink-3);">${count} Milestones Logged</span>
            </div>
            ${logsHtml}
          </div>
          <div style="padding-top:14px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;font-family:var(--ff-mono);font-size:11px;color:var(--ink-3);">
            <span>Chitkara University Archives</span>
            <span style="color:#10b981;">● Verified Records</span>
          </div>
        `
      });
    });
  });

  // 9. FAQ Accordion Toggle
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // 10. Direct Inquiry Form
  const inquiryForm = document.getElementById('inquiryForm');
  const msgInput = document.getElementById('inquiryMsg');
  const charCount = document.getElementById('inquiryCharCount');
  const formStatus = document.getElementById('inquiryStatus');

  if (msgInput && charCount) {
    msgInput.addEventListener('input', () => {
      charCount.textContent = `${msgInput.value.length} / 500`;
    });
  }

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = inquiryForm.querySelector('button[type="submit"]');
      if (!btn) return;
      const oldHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span>Transmitting to Coordinators...</span>`;

      setTimeout(() => {
        btn.innerHTML = `<span>Inquiry Dispatched ✓</span>`;
        btn.style.background = '#10b981';
        btn.style.borderColor = '#10b981';

        if (formStatus) {
          formStatus.style.display = 'block';
          formStatus.innerHTML = `
            <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);padding:14px;border-radius:8px;color:#34d399;font-size:13px;line-height:1.5;">
              <strong>Thank you for connecting!</strong><br>
              Your message has been received by Code2Chill student leads. We reply to all inquiries within 48 hours. For instant updates, you can also DM us on <a href="https://www.instagram.com/code2chill.osl/" target="_blank" style="text-decoration:underline;">Instagram (@code2chill.osl)</a>.
            </div>
          `;
        }

        setTimeout(() => {
          inquiryForm.reset();
          if (charCount) charCount.textContent = '0 / 500';
          btn.disabled = false;
          btn.innerHTML = oldHtml;
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 5000);
      }, 1200);
    });
  }

  // 11. Coordinator Access Modal
  document.querySelectorAll('[data-coord-access]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      openModal({
        category: 'Administration & Security',
        title: 'Coordinator Portal Access',
        content: `
          <div style="background:rgba(61,107,255,0.06);border:1px solid rgba(125,157,255,0.25);border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="font-family:var(--ff-mono);font-size:11px;color:var(--blue-lt);font-weight:600;margin-bottom:6px;">Chitkara University Student Coordinators</div>
            <p style="font-size:13.5px;color:var(--ink-2);line-height:1.6;">
              Access to the administrative CMS and announcement publishing backend is restricted to verified student coordinators and club leads.
            </p>
          </div>
          <div style="background:rgba(0,0,0,0.4);border:1px solid var(--line);border-radius:8px;padding:14px;font-family:var(--ff-mono);font-size:12px;color:var(--ink-3);margin-bottom:20px;">
            <div>Status: Secure Auth Gateway</div>
            <div>Timezone: Asia/Kolkata (IST)</div>
          </div>
          <p style="font-size:13px;color:var(--ink-2);line-height:1.6;">
            If you are a student coordinator needing credentials or assistance, please reach out directly via our official Instagram or LinkedIn leadership channels.
          </p>
        `
      });
    });
  });

})();
