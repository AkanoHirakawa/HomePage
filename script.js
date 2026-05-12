var AUTH_KEY = 'akano_auth_token';
var USERS_KEY = 'akano_users';

window.getAuthUser = function () {
    return localStorage.getItem(AUTH_KEY);
};
window.isLoggedIn = function () {
    return !!localStorage.getItem(AUTH_KEY);
};
window.getUsers = function () {
    var raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
        var old = localStorage.getItem('akano_storage_users');
        if (old) {
            localStorage.setItem(USERS_KEY, old);
            localStorage.removeItem('akano_storage_users');
            return JSON.parse(old);
        }
        return [];
    }
    return JSON.parse(raw);
};
window.saveUsers = function (arr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(arr));
};
window.findUser = function (username) {
    var users = window.getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].user === username) return users[i];
    }
    return null;
};
window.loginAuth = function (username, pass) {
    var user = window.findUser(username);
    if (!user) return { ok: false, error: '用户名不存在' };
    if (user.pass !== pass) return { ok: false, error: '密码错误' };
    localStorage.setItem(AUTH_KEY, username);
    return { ok: true };
};
window.registerAuth = function (userObj) {
    if (window.findUser(userObj.user)) return { ok: false, error: '用户名已被注册' };
    if (!userObj.phone && !userObj.email) return { ok: false, error: '手机号或邮箱至少填一项' };
    var users = window.getUsers();
    users.push(userObj);
    window.saveUsers(users);
    localStorage.setItem(AUTH_KEY, userObj.user);
    return { ok: true };
};
window.logoutAuth = function () {
    localStorage.removeItem(AUTH_KEY);
};

var stars = [];
var starEls = [];
var constellationGroups = [];
var animFrame = 0;

function createStarfield() {
    var starfield = document.getElementById('starfield');
    var W = window.innerWidth || 1920;
    var H = window.innerHeight || 1080;
    var cols = 20;
    var rows = Math.ceil(200 / cols);
    var cellW = W / cols;
    var cellH = H / rows;
    starfield.innerHTML = '';
    stars = [];
    starEls = [];
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            if (starEls.length >= 200) break;
            var el = document.createElement('div');
            el.className = 'star';
            var size = Math.random() * 2.5 + 1;
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.animation = 'none';
            starfield.appendChild(el);
            starEls.push(el);
            var speed = Math.random() * 0.06 + 0.02;
            var angle = Math.random() * Math.PI * 2;
            var baseX = c * cellW + cellW * 0.1;
            var baseY = r * cellH + cellH * 0.1;
            var jitterW = cellW * 0.7;
            var jitterH = cellH * 0.7;
            stars.push({
                x: baseX + Math.random() * jitterW,
                y: baseY + Math.random() * jitterH,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                phase: Math.random() * Math.PI * 2,
                twinkleSpd: Math.random() * 0.008 + 0.003
            });
        }
    }
}

function createConstellation() {
    var canvas = document.getElementById('constellationCanvas');
    var ctx = canvas.getContext('2d');
    var W = canvas.width = window.innerWidth || 1920;
    var H = canvas.height = window.innerHeight || 1080;
    var MAX_DIST = 150;

    function dist(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function findNearest(fromIdx, pool) {
        var best = -1;
        var bestDist = MAX_DIST;
        for (var i = 0; i < pool.length; i++) {
            var d = dist(stars[fromIdx], stars[pool[i]]);
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        }
        return best >= 0 ? pool.splice(best, 1)[0] : -1;
    }

    function makeGroups() {
        constellationGroups = [];
        var pool = [];
        for (var i = 0; i < stars.length; i++) pool.push(i);
        for (var i = pool.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
        }
        var groupCount = Math.floor(Math.random() * 4) + 3;
        for (var g = 0; g < groupCount && pool.length >= 3; g++) {
            var maxSize = Math.floor(Math.random() * 5) + 3;
            var start = pool.pop();
            var members = [start];
            var last = start;
            for (var s = 1; s < maxSize && pool.length > 0; s++) {
                var next = findNearest(last, pool);
                if (next < 0) break;
                members.push(next);
                last = next;
            }
            if (members.length >= 3) {
                constellationGroups.push({
                    members: members,
                    alpha: 0,
                    targetAlpha: Math.random() * 0.22 + 0.1
                });
            }
        }
    }

    function segmentsCross(a1, a2, b1, b2) {
        function ccw(p, q, r) {
            return (r.y - p.y) * (q.x - p.x) > (q.y - p.y) * (r.x - p.x);
        }
        return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
    }

    function hasLineCrossing(group) {
        var m = group.members;
        for (var i = 0; i < m.length - 1; i++) {
            var a1 = stars[m[i]];
            var a2 = stars[m[i + 1]];
            for (var j = i + 2; j < m.length - 1; j++) {
                var b1 = stars[m[j]];
                var b2 = stars[m[j + 1]];
                if (dist(a1, a2) > MAX_DIST * 1.5 || dist(b1, b2) > MAX_DIST * 1.5) return true;
                if (segmentsCross(a1, a2, b1, b2)) return true;
            }
        }
        return false;
    }

    function cleanCrossingGroups() {
        for (var g = constellationGroups.length - 1; g >= 0; g--) {
            if (hasLineCrossing(constellationGroups[g])) {
                constellationGroups.splice(g, 1);
            }
        }
    }

    makeGroups();
    cleanCrossingGroups();

    function loop() {
        animFrame++;
        W = canvas.width;
        H = canvas.height;

        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            s.x += s.vx;
            s.y += s.vy;
            if (s.x < -20) s.x = W + 20;
            if (s.x > W + 20) s.x = -20;
            if (s.y < -20) s.y = H + 20;
            if (s.y > H + 20) s.y = -20;
            s.phase += s.twinkleSpd;
            var op = 0.25 + 0.5 * ((Math.sin(s.phase) + 1) / 2);
            var el = starEls[i];
            if (el) {
                el.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px)';
                el.style.opacity = op;
            }
        }

        ctx.clearRect(0, 0, W, H);

        for (var g = 0; g < constellationGroups.length; g++) {
            var group = constellationGroups[g];
            group.alpha += (group.targetAlpha - group.alpha) * 0.01;
            if (group.alpha < 0.015) continue;
            var m = group.members;
            for (var k = 0; k < m.length - 1; k++) {
                var si = m[k];
                var sj = m[k + 1];
                if (si >= stars.length || sj >= stars.length) continue;
                var a = stars[si];
                var b = stars[sj];
                var grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.25, 'rgba(255,255,255,' + group.alpha + ')');
                grad.addColorStop(0.75, 'rgba(255,255,255,' + group.alpha + ')');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        if (animFrame % 300 === 0) {
            makeGroups();
            cleanCrossingGroups();
            if (constellationGroups.length < 2) { makeGroups(); cleanCrossingGroups(); }
        }

        requestAnimationFrame(loop);
    }

    loop();

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth || 1920;
        canvas.height = window.innerHeight || 1080;
        W = canvas.width;
        H = canvas.height;
    });
}

function createMeteors() {
    const starfield = document.getElementById('starfield');
    const maxMeteors = 2;
    let activeMeteors = 0;
    function spawnMeteor() {
        if (activeMeteors >= maxMeteors) return;
        activeMeteors++;
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        const duration = Math.random() * 3 + 1;
        meteor.style.animationDuration = `${duration}s`;
        meteor.style.height = `${Math.random() * 3 + 2}px`;
        starfield.appendChild(meteor);
        meteor.addEventListener('animationend', () => {
            meteor.remove();
            activeMeteors--;
        });
    }
    function scheduleMeteor() {
        spawnMeteor();
        setTimeout(scheduleMeteor, Math.random() * 5000 + 10000);
    }
    scheduleMeteor();
}

function updateDateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('timeDisplay').textContent = timeString;
    const dateString = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    document.getElementById('dateDisplay').textContent = dateString;
    updateLunarDate(now);
}

function updateLunarDate(date) {
    const lunarDates = ["正月初一", "正月十五", "二月初一", "二月十五", "三月初一", "三月十五", "四月初一", "四月十五", "五月初一", "五月十五", "六月初一", "六月十五", "七月初一", "七月十五", "八月初一", "八月十五", "九月初一", "九月十五", "十月初一", "十月十五", "十一月初一", "十一月十五", "腊月初一", "腊月十五"];
    const day = date.getDate();
    const month = date.getMonth();
    const lunarMonth = month < 11 ? month + 1 : 0;
    const lunarDay = day <= 15 ? 0 : 1;
    const index = lunarMonth * 2 + lunarDay;
    const heavenlyStems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const earthlyBranches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    const yearIndex = (date.getFullYear() - 4) % 60;
    const stemIndex = yearIndex % 10;
    const branchIndex = yearIndex % 12;
    const lunarYear = "农历" + heavenlyStems[stemIndex] + earthlyBranches[branchIndex] + "年";
    document.getElementById('lunarDate').textContent = lunarYear + lunarDates[index];
}

function getWeather() {
    var lat = 23.1291;
    var lon = 113.2644;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (pos) { fetchWeather(pos.coords.latitude, pos.coords.longitude); },
            function () { fetchWeather(lat, lon); },
            { timeout: 3000, maximumAge: 600000 }
        );
    } else {
        fetchWeather(lat, lon);
    }
}

function fetchWeather(lat, lon) {
    var host = 'https://nf5vxp5t6b.re.qweatherapi.com';
    var key = 'a4e3f58fac344d79b967f350a89365aa';
    var url = host + '/v7/weather/now?location=' + lon + ',' + lat + '&key=' + key;
    fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.code !== '200') throw new Error(data.code);
            var now = data.now;
            document.getElementById('weatherIcon').textContent = '天气';
            document.getElementById('weatherInfo').textContent = now.text + ' ' + now.temp + 'C';
        })
        .catch(function () {
            document.getElementById('weatherIcon').textContent = '天气';
            document.getElementById('weatherInfo').textContent = '获取失败';
        });
}

function setupScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.section-title, .glass-card').forEach(el => {
        observer.observe(el);
    });
    const heroTitle = document.querySelector('.akano-main-title');
    const heroSubtitle = document.querySelector('.akano-studio-subtitle');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const scrollRatio = Math.min(scrollY / 500, 1);
        const newColor = `linear-gradient(135deg, rgba(255, 255, 255, ${1 - scrollRatio * 0.5}), rgba(255, 107, 53, ${1 - scrollRatio * 0.3}), rgba(255, 140, 66, ${1 - scrollRatio * 0.3}))`;
        heroTitle.style.backgroundImage = newColor;
        heroSubtitle.style.color = `rgba(255, 255, 255, ${1 - scrollRatio * 0.5})`;
    });
}

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const navLinks = document.getElementById('navLinks');
    const navLinksItems = document.querySelectorAll('.nav-link');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}

window.addEventListener('load', () => {
    createStarfield();
    createConstellation();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    getWeather();
    setInterval(getWeather, 3600000);
    setupScrollAnimations();
    window.scrollTo(0, 0);
    setTimeout(() => {
        document.getElementById('loading').classList.add('fade-out');
    }, 1000);
    createMeteors();
    setupMobileMenu();
});
