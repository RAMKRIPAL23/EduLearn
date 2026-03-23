/*
  =====================================================
  script.js — EduLearn LMS ka poora JavaScript Logic
  =====================================================
  Yeh file website ka kaam karne wala hissa hai:

  1. coursesDB   → MongoDB jaisi fake database (courses ka data)
  2. localStorage → Browser me data save karna (progress, notes, theme)
  3. renderC()   → Course cards HTML me dikhana
  4. filter()    → Live search aur category filter
  5. renderPT()  → Progress tracker update karna
  6. openVid()   → YouTube video modal kholna
  7. selCh()     → Chapter select karna → video play
  8. openNotes() → Study notes modal kholna
  9. Dark Mode   → Theme toggle aur localStorage me save
  10. submitForm() → Contact form validation
  11. showToast() → Success/error message dikhana
  =====================================================
  Yeh file index.html ke sabse neeche load hoti hai
  Bootstrap JS ke baad — kyunki modal use karta hai
  =====================================================
*/


/* ============================================================
   COURSES DATABASE (MongoDB Simulation)
   Yeh array ek fake MongoDB collection hai
   Har object ek course document hai
   Production me yeh data MongoDB Atlas se API ke through aata
   ============================================================ */
const DB = [
  {
    id: 1,                    /* Unique course ID → localStorage me key ke roop me use hoga */
    title: 'Python with Flask & Django',
    cat: 'python',            /* Category → filter pills se match hota hai */
    lvl: 'advanced',          /* Level → card pe badge dikhata hai */
    img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&q=80',  /* Thumbnail image */
    dur: '12 weeks',          /* Duration */
    les: 48,                  /* Total lessons */
    rat: 4.9,                 /* Rating out of 5 */
    stu: 1240,                /* Enrolled students count */
    tags: ['Python','Flask','Django','REST API'],  /* Skill tags → search me bhi kaam aate hain */
    p: 68                     /* Default progress percentage (new user ke liye) */
  },
  {
    id: 2,
    title: 'Full-Stack Web Development',
    cat: 'web',
    lvl: 'intermediate',
    img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&q=80',
    dur: '10 weeks',
    les: 62,
    rat: 4.8,
    stu: 980,
    tags: ['HTML5','CSS3','Bootstrap 5','JavaScript'],
    p: 35
  },
  {
    id: 3,
    title: 'Data Science & Machine Learning',
    cat: 'data',
    lvl: 'intermediate',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    dur: '14 weeks',
    les: 55,
    rat: 4.7,
    stu: 760,
    tags: ['Python','Pandas','Scikit-learn'],
    p: 20
  },
  {
    id: 4,
    title: 'Cybersecurity Fundamentals',
    cat: 'security',
    lvl: 'beginner',
    img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80',
    dur: '8 weeks',
    les: 36,
    rat: 4.8,
    stu: 540,
    tags: ['Network','OWASP','Pentesting'],
    p: 85
  },
  {
    id: 5,
    title: 'Android App Development',
    cat: 'mobile',
    lvl: 'intermediate',
    img: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=600&q=80',
    dur: '10 weeks',
    les: 44,
    rat: 4.6,
    stu: 620,
    tags: ['Android','Kotlin','Java'],
    p: 0
  },
  {
    id: 6,
    title: 'React & Next.js Mastery',
    cat: 'web',
    lvl: 'advanced',
    img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80',
    dur: '8 weeks',
    les: 40,
    rat: 4.9,
    stu: 890,
    tags: ['React','Next.js','TypeScript'],
    p: 55
  },
  {
    id: 7,
    title: 'Database Design & MongoDB',
    cat: 'data',
    lvl: 'beginner',
    img: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80',
    dur: '6 weeks',
    les: 28,
    rat: 4.7,
    stu: 450,
    tags: ['MongoDB','SQL','NoSQL'],
    p: 90
  },
  {
    id: 8,
    title: 'Ethical Hacking & Pentesting',
    cat: 'security',
    lvl: 'advanced',
    img: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&q=80',
    dur: '12 weeks',
    les: 52,
    rat: 4.8,
    stu: 380,
    tags: ['Kali Linux','Metasploit','Burp Suite'],
    p: 10
  }
];


/* ============================================================
   LOCALSTORAGE HELPERS
   localStorage → browser me data permanently store hota hai
   Page refresh karne pe bhi data rehta hai

   3 localStorage keys hain:
   - 'lmsProg'  → har course ki progress (object)
   - 'lmsNotes' → har course ke notes (object)
   - 'lmsTheme' → light ya dark theme (string)
   ============================================================ */

/* Progress padhna → agar kuch save nahi to empty object */
const gP = () => JSON.parse(localStorage.getItem('lmsProg') || '{}');

/* Progress save karna */
const sP = d => localStorage.setItem('lmsProg', JSON.stringify(d));

/* Notes padhna → agar kuch save nahi to empty object */
const gN = () => JSON.parse(localStorage.getItem('lmsNotes') || '{}');

/* Ek course ke notes save karna */
const sN = (courseName, text) => {
  const allNotes = gN();          /* Sabhi notes pado pehle */
  allNotes[courseName] = text;    /* Is course ke notes update karo */
  localStorage.setItem('lmsNotes', JSON.stringify(allNotes));  /* Wapas save karo */
};


/* ============================================================
   STATE VARIABLES
   Yeh variables current state track karte hain
   ============================================================ */

/* curCat → abhi kaun si category selected hai filter me */
let curCat = 'all';

/* curNote → abhi kaun sa course ke notes open hain modal me */
let curNote = '';


/* ============================================================
   renderC() — Course Cards Render karna
   Yeh function course cards ka HTML banata hai
   aur #cgrid div me inject karta hai
   ============================================================ */
function renderC(list) {
  const grid    = document.getElementById('cgrid');   /* Cards container */
  const noRes   = document.getElementById('nores');   /* No results message */

  /* Agar koi course match nahi → no results message dikhao */
  if (!list.length) {
    grid.innerHTML = '';
    noRes.style.display = 'block';
    return;
  }

  noRes.style.display = 'none';   /* Results hain → hide karo message */

  const prog = gP();   /* localStorage se saari progress pado */

  /* Har course ke liye HTML card banao */
  grid.innerHTML = list.map(c => {

    /* Progress → pehle localStorage check karo, warna DB ki default value */
    const pv = prog[c.id] !== undefined ? prog[c.id] : c.p;

    /* Difficulty badge ka color class */
    const lc = c.lvl === 'beginner' ? 'cl-b' : c.lvl === 'intermediate' ? 'cl-i' : 'cl-a';

    /* Template literal se HTML string banao */
    return `
      <div class="col-xl-3 col-lg-4 col-md-6">
        <div class="cc">

          <!-- Course thumbnail image + difficulty badge -->
          <div class="ct">
            <img src="${c.img}" alt="${c.title}" loading="lazy"/>
            <span class="cl ${lc}">${c.lvl}</span>
          </div>

          <!-- Card body -->
          <div class="cb">
            <div class="c-cat">${c.cat}</div>
            <div class="c-title">${c.title}</div>

            <!-- Duration aur lessons -->
            <div class="c-meta">
              <span>⏱ ${c.dur}</span>
              <span>▶ ${c.les} lessons</span>
            </div>

            <!-- Rating aur students count -->
            <div class="c-meta">
              <span class="c-stars">★ ${c.rat}</span>
              <span>👥 ${c.stu.toLocaleString()}</span>
            </div>

            <!-- Progress bar → localStorage se value aati hai -->
            <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--txm);margin-bottom:4px">
              <span>Progress</span><span>${pv}%</span>
            </div>
            <div class="progress">
              <div class="progress-bar" style="width:${pv}%"></div>
            </div>

            <!-- Skill tags → pehle 3 dikhao -->
            <div class="c-tags mt-2">
              ${c.tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}
            </div>

            <!-- Action buttons -->
            <div class="c-foot">
              <div class="d-flex gap-1">
                <!-- Watch → YouTube video modal kholega -->
                <button class="btn-w" onclick="openVid(${c.id})">▶ Watch</button>
                <!-- Notes → Study notes modal kholega, single quotes escape ki hain -->
                <button class="btn-n" onclick="openNotes('${c.title.replace(/'/g, "\\'")}')">📝 Notes</button>
              </div>
              <!-- Enroll/Continue → pv > 0 matlab already enrolled hai -->
              <button class="btn-e" onclick="enroll(${c.id}, this)">${pv > 0 ? 'Continue' : 'Enroll'}</button>
            </div>

          </div>
        </div>
      </div>`;
  }).join('');
}


/* ============================================================
   filter() — Live Search + Category Filter
   Search input ya category pill change hone pe call hota hai
   Dono filters ek saath kaam karte hain
   ============================================================ */
function filter() {
  /* Search input ki value lowercase me */
  const q = document.getElementById('cSrch').value.toLowerCase();

  /* DB ko filter karo */
  const result = DB.filter(c => {
    /* Category match → 'all' ho ya course ki category match ho */
    const matchCat = curCat === 'all' || c.cat === curCat;

    /* Search match → koi query nahi, ya title me ho, ya koi tag me ho */
    const matchQ = !q || c.title.toLowerCase().includes(q) ||
                   c.tags.some(t => t.toLowerCase().includes(q));

    /* Dono conditions true honi chahiye */
    return matchCat && matchQ;
  });

  renderC(result);   /* Filtered courses render karo */
}


/* ============================================================
   catF() — Category Filter Pill Click
   Category button click pe call hota hai
   Active pill ka style change karta hai
   ============================================================ */
function catF(cat, btn) {
  curCat = cat;   /* Global state update karo */

  /* Sabhi pills se 'on' class hatao */
  document.querySelectorAll('.cp').forEach(b => b.classList.remove('on'));

  /* Clicked pill pe 'on' class lagao → blue active style */
  btn.classList.add('on');

  filter();   /* Re-filter karo */
}


/* ============================================================
   heroSearch() — Hero Section Search Button
   Hero ke search bar se courses section pe le jaata hai
   Search term courses section ke search bar me copy hota hai
   ============================================================ */
function heroSearch() {
  /* Hero input ki value courses search me copy karo */
  document.getElementById('cSrch').value = document.getElementById('heroSrch').value;

  /* Courses section pe smoothly scroll karo */
  document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });

  /* 400ms baad filter karo → scroll animation ke baad */
  setTimeout(filter, 400);
}


/* ============================================================
   enroll() — Course Enroll karna
   "Enroll" button click pe call hota hai
   localStorage me 5% se start karta hai aur button text badalta hai
   ============================================================ */
function enroll(id, btn) {
  const prog = gP();               /* Purana progress pado */
  if (!prog[id]) prog[id] = 5;    /* Sirf naya enroll karo agar pehle nahi kiya */
  sP(prog);                        /* localStorage me save karo */
  btn.textContent = 'Continue';   /* Button text badlo */
  showToast('Enrolled! 🎉');      /* Success toast dikhao */
  renderPT();                      /* Progress tracker refresh karo */
  filter();                        /* Course grid refresh karo → progress update hogi */
}


/* ============================================================
   renderPT() — Progress Tracker Render karna
   Enrolled courses ka dynamic progress dashboard banata hai
   Har enrolled course ke liye ek card banata hai
   ============================================================ */
function renderPT() {
  const prog = gP();   /* localStorage se progress pado */

  /* Sirf woh courses jinka progress > 0 hai (enrolled hain) */
  const enrolled = DB.filter(c => prog[c.id] > 0);

  const grid = document.getElementById('ptgrid');

  /* Koi enrolled nahi → placeholder message */
  if (!enrolled.length) {
    grid.innerHTML = '<div class="col-12 text-center" style="color:var(--txm);padding:32px 0">Enroll in a course to see progress here.</div>';
    return;
  }

  /* Enrolled courses ke cards banao */
  grid.innerHTML = enrolled.map(c => {
    const pv = prog[c.id];   /* Is course ki current progress */

    return `
      <div class="col-md-6">
        <div class="ptcard">

          <!-- Course image + title + duration -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <!-- Course ki real thumbnail image → c.img se aati hai -->
            <img src="${c.img}" alt="${c.title}"
                 style="width:52px;height:52px;border-radius:10px;object-fit:cover;flex-shrink:0"/>
            <div>
              <div class="ptcard-title">${c.title}</div>
              <div class="ptcard-sub">${c.dur} · ${c.les} lessons</div>
            </div>
          </div>

          <!-- Progress percentage label -->
          <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--txm);margin-bottom:5px">
            <span>Completion</span>
            <span style="color:var(--pr);font-weight:700">${pv}%</span>
          </div>

          <!-- Progress bar -->
          <div class="progress mb-3">
            <div class="progress-bar" style="width:${pv}%"></div>
          </div>

          <!-- Control buttons -->
          <div class="d-flex gap-2">
            <!-- -10% button → progress kam karo -->
            <button onclick="updP(${c.id}, -10)"
              style="background:var(--surf2);border:1px solid var(--bd);border-radius:8px;padding:4px 12px;cursor:pointer;color:var(--tx);font-size:.78rem">
              -10%
            </button>
            <!-- +10% button → progress badhao -->
            <button onclick="updP(${c.id}, 10)"
              style="background:var(--pr);border:none;border-radius:8px;padding:4px 12px;cursor:pointer;color:#fff;font-size:.78rem">
              +10%
            </button>
            <!-- Notes button → is course ke notes kholega -->
            <button onclick="openNotes('${c.title.replace(/'/g, "\\'")}');"
              style="background:var(--ac2);border:none;border-radius:8px;padding:4px 12px;cursor:pointer;color:#fff;font-size:.78rem;margin-left:auto">
              📝
            </button>
          </div>

        </div>
      </div>`;
  }).join('');
}


/* ============================================================
   updP() — Progress Update karna (+10% ya -10%)
   localStorage me update karta hai
   0% se neeche aur 100% se upar nahi jaata
   ============================================================ */
function updP(id, delta) {
  const prog = gP();

  /* Math.min/max se 0-100 range me rakho */
  prog[id] = Math.min(100, Math.max(0, (prog[id] || 0) + delta));

  sP(prog);                          /* Save karo */
  renderPT();                         /* Tracker refresh karo */
  filter();                           /* Course cards bhi refresh → progress update hogi */
  showToast('Progress: ' + prog[id] + '%');   /* Toast dikhao */
}


/* ============================================================
   YOUTUBE VIDEO IDs
   Har course ke 5 chapters ke liye YouTube video IDs
   YT[courseId][chapterIndex] → video ID milti hai
   selCh() me YouTube embed URL me use hoti hai
   ============================================================ */
const YT = {
  1: ['PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH','_uQrJ0TkZlc','FGl9UX-4PQg','S9uPNppGsGo','WS0Tv9Y2rMw'],           /* Python */
  2: ['pQN-pnXPaVg','qz0aGYrrlhU','PkZNo7MFNFg','ysEN5RaKOlA','UB1O30fR-EE'],                                   /* Web Dev */
  3: ['ua-CiDNNj30','vmEHCKozLgw','KNAWp2S3w94','i_LwzRVP7bg','aircAruvnKk'],                                   /* Data Science */
  4: ['3Kq1MIfTWCE','lpa8uy4b8uE','eTNS2MtEqnQ','inWWhr5tnEA','hXSFdwIIsXc'],                                   /* Cybersecurity */
  5: ['fis26HvvDII','EknqNAPlHpk','LAHQ_TMFl8E','B12Pv8KUVWQ','tZvjSl9dMkA'],                                   /* Android */
  6: ['w7ejDZ8SWv8','Ke90Tje7VS0','1wZoGF6BfqQ','4UZrsTqkcW4','FJDVKeh7RJI'],                                   /* React */
  7: ['c2M-rlkkT5o','oSIv-E_hOzs','ExcRbSdMzvY','ofme2o29ngU','GHs2coAuVg0'],                                   /* MongoDB */
  8: ['3Kq1MIfTWCE','hXSFdwIIsXc','lpa8uy4b8uE','eTNS2MtEqnQ','inWWhr5tnEA']                                    /* Ethical Hacking */
};

/* Chapter names → sabhi courses ke liye same 5 chapters hain */
const CH_NAMES = ['Introduction & Setup','Core Concepts','Hands-on Project','Advanced Topics','Final Assessment'];


/* ============================================================
   openVid() — Video Modal Kholna
   Course ke "▶ Watch" button pe call hota hai
   Bootstrap modal open karta hai YouTube player ke saath
   ============================================================ */
function openVid(id) {
  /* DB se course ka data nikalo */
  const c = DB.find(x => x.id === id);

  /* Modal title me course ka naam set karo */
  document.getElementById('vmTitle').textContent = c.title;

  /* YouTube iframe reset karo → purana video band karo */
  document.getElementById('ytFrame').src = '';

  /* Label reset karo */
  document.getElementById('vidLbl').textContent = '▶ Select a chapter below to play';

  /* Is course ke video IDs nikalo */
  const vids = YT[id] || YT[1];   /* Fallback to Python agar ID na mile */

  /* 5 chapter items generate karo */
  document.getElementById('chapters').innerHTML = CH_NAMES.map((ch, i) => `
    <div class="ch-item" onclick="selCh(this, '${ch}', ${id}, ${i})">
      <div class="ch-num">${i + 1}</div>
      <span style="flex:1;font-size:.87rem;color:var(--tx)">${ch}</span>
      <span style="font-size:.75rem;color:var(--txm)">${15 + i * 8} min</span>
      <i class="bi bi-youtube" style="color:#ff0000;font-size:.85rem;margin-left:4px"></i>
    </div>`).join('');

  /* Bootstrap modal open karo */
  new bootstrap.Modal(document.getElementById('vmModal')).show();
}


/* ============================================================
   selCh() — Chapter Select karna
   Chapter item click pe call hota hai
   YouTube video change karta hai
   ============================================================ */
function selCh(el, name, courseId, idx) {
  /* Sabhi chapters ka style reset karo */
  document.querySelectorAll('.ch-item').forEach(x => {
    x.style.background = 'var(--surf2)';
    x.style.color = 'var(--tx)';
  });

  /* Clicked chapter ko highlight karo → blue */
  el.style.background = 'var(--pr)';
  el.style.color = '#fff';

  /* YouTube video ID nikalo */
  const videoId = YT[courseId][idx];

  /* iframe ka src update karo → autoplay=1 se automatically start hogi */
  document.getElementById('ytFrame').src =
    `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  /* Label update karo */
  document.getElementById('vidLbl').textContent = '▶ Now Playing: ' + name;
}

/* Modal close hone pe video stop karo → src empty karo */
document.getElementById('vmModal').addEventListener('hidden.bs.modal', function () {
  document.getElementById('ytFrame').src = '';
});


/* ============================================================
   openNotes() — Study Notes Modal Kholna
   "📝 Notes" button click pe call hota hai
   localStorage se purane notes load karta hai
   ============================================================ */
function openNotes(course) {
  curNote = course;   /* Global state → current notes kis course ke hain */

  /* Modal title me course naam set karo */
  document.getElementById('nmTitle').textContent = '📝 Notes – ' + course;

  /* Course name tag badge me set karo */
  document.getElementById('ncourse').textContent = course;

  /* localStorage se purane notes load karo → na ho to empty string */
  document.getElementById('nta').value = gN()[course] || '';

  /* Bootstrap modal open karo */
  new bootstrap.Modal(document.getElementById('nmModal')).show();
}

/* Notes textarea → har keystroke pe auto-save hota hai localStorage me */
document.getElementById('nta').addEventListener('input', function () {
  if (curNote) sN(curNote, this.value);   /* curNote set ho tab hi save karo */
});

/* saveNotes() → Save button → notes save karo aur modal band karo */
function saveNotes() {
  sN(curNote, document.getElementById('nta').value);   /* Manual save */
  showToast('Notes saved! 📝');
  bootstrap.Modal.getInstance(document.getElementById('nmModal')).hide();
}

/* clearNotes() → Clear button → textarea aur localStorage dono clear */
function clearNotes() {
  document.getElementById('nta').value = '';   /* UI clear */
  sN(curNote, '');                              /* localStorage bhi clear */
}


/* ============================================================
   DARK MODE TOGGLE
   localStorage se theme pado → page load pe apply karo
   Toggle button pe click karne se theme switch hoti hai
   ============================================================ */

/* IIFE → Immediately Invoked Function Expression
   Page load hote hi run hota hai, theme apply karta hai */
(function () {
  /* localStorage se saved theme pado, default 'light' */
  const savedTheme = localStorage.getItem('lmsTheme') || 'light';

  /* html element pe data-theme attribute set karo → CSS variables change hote hain */
  document.documentElement.setAttribute('data-theme', savedTheme);

  /* Button icon set karo → dark me sun, light me moon */
  document.getElementById('themeBtn').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
})();

/* Toggle button click event */
document.getElementById('themeBtn').addEventListener('click', function () {
  /* Current theme nikalo */
  const current = document.documentElement.getAttribute('data-theme');

  /* Opposite theme → dark tha to light, light tha to dark */
  const next = current === 'dark' ? 'light' : 'dark';

  /* HTML element pe apply karo → poori CSS instantly change ho jaati hai */
  document.documentElement.setAttribute('data-theme', next);

  /* localStorage me save karo → refresh pe bhi yaad rahega */
  localStorage.setItem('lmsTheme', next);

  /* Button icon update karo */
  this.textContent = next === 'dark' ? '☀️' : '🌙';
});


/* ============================================================
   CONTACT FORM VALIDATION
   submitForm() → form submit hone pe call hota hai
   Har field ko validate karta hai
   Error message dikhata hai ya toast success
   ============================================================ */
function submitForm(e) {
  e.preventDefault();   /* Browser ka default submit band karo */

  let ok = true;   /* Sabhi validations pass hain? */

  /* Validation rules array → har field ke liye ek object */
  const rules = [
    {
      id: 'fn',              /* Input field ka ID */
      eid: 'efn',            /* Error message div ka ID */
      msg: 'Please enter your name.',
      v: val => val.trim().length > 1   /* Validation function → 2+ characters */
    },
    {
      id: 'fe',
      eid: 'efe',
      msg: 'Valid email required.',
      v: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)   /* Email regex */
    },
    {
      id: 'fs',
      eid: 'efs',
      msg: 'Please enter a subject.',
      v: val => val.trim().length > 2
    },
    {
      id: 'fm',
      eid: 'efm',
      msg: 'Message must be at least 10 characters.',
      v: val => val.trim().length > 9
    }
  ];

  /* Har rule check karo */
  rules.forEach(rule => {
    const el = document.getElementById(rule.id);    /* Input element */
    const em = document.getElementById(rule.eid);   /* Error div */

    if (!rule.v(el.value)) {
      /* Validation fail → red border aur error message */
      el.classList.add('err');
      em.textContent = rule.msg;
      ok = false;
    } else {
      /* Validation pass → reset */
      el.classList.remove('err');
      em.textContent = '';
    }
  });

  /* Sabhi validations pass → success toast aur form reset */
  if (ok) {
    showToast("Message sent! We'll reply soon 🚀");
    document.getElementById('cf').reset();   /* Form ke sabhi fields clear */
  }
}


/* ============================================================
   showToast() — Success/Info Message Dikhana
   Bottom-right corner me animated notification
   2.8 seconds baad automatically chhup jaata hai
   ============================================================ */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;            /* Message set karo */
  toast.classList.add('show');        /* .show class → CSS se visible ho jaata hai */

  /* 2800ms baad .show remove karo → hide ho jaata hai */
  setTimeout(() => toast.classList.remove('show'), 2800);
}


/* ============================================================
   SCROLL EVENT → Navbar Shadow
   Page scroll hone pe navbar pe shadow aata hai
   ============================================================ */
window.addEventListener('scroll', () => {
  /* 50px se zyada scroll hone pe shadow add karo */
  document.getElementById('nav').style.boxShadow =
    window.scrollY > 50 ? '0 4px 22px rgba(0,0,0,.08)' : 'none';
});


/* ============================================================
   INITIALIZATION
   Page load hone pe sabse pehle yeh run hota hai
   Courses aur Progress Tracker render karta hai
   ============================================================ */
renderC(DB);    /* Sabhi 8 courses render karo → page load pe */
renderPT();     /* Progress tracker render karo → enrolled courses ke liye */
