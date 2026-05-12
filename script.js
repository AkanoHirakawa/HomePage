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

function getWeatherCodeInfo(code) {
    const map = {
        0:  { icon: '☀️', text: '晴朗' },
        1:  { icon: '🌤️', text: '少云' },
        2:  { icon: '⛅', text: '多云' },
        3:  { icon: '☁️', text: '阴天' },
        45: { icon: '🌫️', text: '雾' },
        48: { icon: '🌫️', text: '雾凇' },
        51: { icon: '🌦️', text: '小毛毛雨' },
        53: { icon: '🌦️', text: '毛毛雨' },
        55: { icon: '🌦️', text: '大毛毛雨' },
        56: { icon: '🌧️', text: '冻毛毛雨' },
        57: { icon: '🌧️', text: '大冻毛毛雨' },
        61: { icon: '🌧️', text: '小雨' },
        63: { icon: '🌧️', text: '中雨' },
        65: { icon: '🌧️', text: '大雨' },
        66: { icon: '🌧️', text: '冻雨' },
        67: { icon: '🌧️', text: '大冻雨' },
        71: { icon: '❄️', text: '小雪' },
        73: { icon: '❄️', text: '中雪' },
        75: { icon: '❄️', text: '大雪' },
        77: { icon: '🌨️', text: '雪粒' },
        80: { icon: '🌦️', text: '阵雨' },
        81: { icon: '🌦️', text: '大阵雨' },
        82: { icon: '🌦️', text: '暴阵雨' },
        85: { icon: '🌨️', text: '阵雪' },
        86: { icon: '🌨️', text: '大阵雪' },
        95: { icon: '⛈️', text: '雷暴' },
        96: { icon: '⛈️', text: '雷暴冰雹' },
        99: { icon: '⛈️', text: '大冰雹雷暴' }
    };
    return map[code] || { icon: '🌡️', text: '未知' };
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Shanghai`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const current = data.current;
            const temp = Math.round(current.temperature_2m);
            const code = current.weather_code;
            const info = getWeatherCodeInfo(code);
            document.getElementById('weatherIcon').textContent = info.icon;
            document.getElementById('weatherInfo').textContent = `${info.text} ${temp}°C`;
        })
        .catch(() => {
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
