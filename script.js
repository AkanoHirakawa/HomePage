function createStarfield() {
    const starfield = document.getElementById('starfield');
    const starCount = 200;
    starfield.innerHTML = '';
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        starfield.appendChild(star);
    }
}

function createMeteors() {
    const starfield = document.getElementById('starfield');
    const maxMeteors = 5;
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
        setTimeout(scheduleMeteor, Math.random() * 1500 + 500);
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

function getQWeatherIcon(code) {
    const map = {
        '100': '☀️', '150': '🌙',
        '101': '⛅', '151': '☁️', '102': '🌤️',
        '103': '⛅', '104': '☁️', '154': '☁️',
        '300': '🌦️', '301': '🌧️', '302': '⛈️', '303': '⛈️',
        '304': '🌧️', '305': '🌧️', '306': '🌧️', '307': '🌧️',
        '308': '🌧️', '309': '🌧️', '310': '🌧️', '311': '🌧️',
        '312': '🌧️', '313': '🌧️', '314': '🌧️', '315': '🌧️',
        '316': '🌧️', '317': '🌧️', '318': '🌧️',
        '350': '🌦️', '351': '🌧️', '399': '🌧️',
        '400': '❄️', '401': '❄️', '402': '❄️', '403': '❄️',
        '404': '🌨️', '405': '🌨️', '406': '🌨️', '407': '🌨️',
        '408': '❄️', '409': '❄️', '410': '❄️',
        '456': '🌨️', '457': '🌨️', '499': '❄️',
        '500': '🌫️', '501': '🌫️', '502': '🌫️',
        '503': '🌪️', '504': '🌪️', '507': '🌪️', '508': '🌪️',
        '509': '🌫️', '510': '🌫️', '511': '🌫️', '512': '🌫️',
        '513': '🌫️', '514': '🌫️', '515': '🌫️',
        '900': '🥵', '901': '🥶', '999': '🌡️'
    };
    return map[String(code)] || '🌡️';
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
            var icon = getQWeatherIcon(now.icon);
            document.getElementById('weatherIcon').textContent = icon;
            document.getElementById('weatherInfo').textContent = now.text + ' ' + now.temp + '°C';
        })
        .catch(function () {
            document.getElementById('weatherIcon').textContent = '🌡️';
            document.getElementById('weatherInfo').textContent = '获取天气失败';
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
