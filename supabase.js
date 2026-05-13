var SUPABASE_URL = 'https://izhojeyadxffzxukgonj.supabase.co';
var SUPABASE_KEY = 'sb_publishable_a8AxM59ZlHD3B4KUbD8wFA_PWzoeEPL';

if (!window.supabase) {
    alert('Supabase SDK failed to load. Please check supabase-client.js exists.');
    throw new Error('supabase not loaded');
}
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
var currentSession = null;

supabase.auth.onAuthStateChange(function (event, session) {
    currentSession = session;
    if (event === 'SIGNED_IN') {
        localStorage.setItem('akano_auth_email', session.user.email);
    } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('akano_auth_email');
        currentSession = null;
    }
    updateUserUI();
});

supabase.auth.getSession().then(function (r) {
    if (r.data && r.data.session) currentSession = r.data.session;
    updateUserUI();
});

window.getSession = function () { return currentSession; };
window.isLogged = function () { return !!currentSession; };

window.signUpEmail = function (email, password, username) {
    return supabase.auth.signUp({ email: email, password: password }).then(function (r) {
        if (r.data && r.data.user) {
            return supabase.from('profiles').upsert({
                id: r.data.user.id, username: username, nickname: username
            }).then(function () { return { ok: true }; });
        }
        return { ok: false, error: (r.error && r.error.message) || 'reg failed' };
    });
};

window.signInEmail = function (email, password) {
    return supabase.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
        if (r.data && r.data.user) {
            return supabase.auth.getSession().then(function (sr) {
                currentSession = sr.data && sr.data.session;
                return { ok: true };
            });
        }
        return { ok: false, error: (r.error && r.error.message) || 'login failed' };
    });
};

window.signOutAll = function () { return supabase.auth.signOut(); };

function ensureSession() {
    if (currentSession) return Promise.resolve(currentSession);
    return supabase.auth.getSession().then(function (r) {
        currentSession = r.data && r.data.session;
        return currentSession;
    });
}

window.getProfile = function () {
    return ensureSession().then(function (s) {
        if (!s) return null;
        return supabase.from('profiles').select('*').eq('id', s.user.id).single().then(function (r) { return r.data; });
    });
};

window.updateProfile = function (data) {
    return ensureSession().then(function (s) {
        if (!s) throw new Error('not logged in');
        return supabase.from('profiles').update(data).eq('id', s.user.id);
    });
};

window.uploadAvatar = function (file) {
    return ensureSession().then(function (s) {
        if (!s) throw new Error('not logged in');
        var ext = file.name.split('.').pop();
        var path = s.user.id + '/avatar.' + ext;
        return supabase.storage.from('avatars').upload(path, file, { upsert: true }).then(function (r) {
            if (r.error) throw r.error;
            var url = SUPABASE_URL + '/storage/v1/object/public/avatars/' + path;
            return supabase.from('profiles').update({ avatar_url: url }).eq('id', s.user.id).then(function () { return url; });
        });
    });
};

window.uploadFile = function (file, isPublic) {
    return ensureSession().then(function (s) {
        if (!s) throw new Error('not logged in');
        var path = s.user.id + '/' + Date.now() + '_' + file.name;
        return supabase.storage.from('files').upload(path, file).then(function (r) {
            if (r.error) throw r.error;
            return supabase.from('private_files').insert({
                user_id: s.user.id, filename: file.name, file_type: file.type,
                file_size: file.size, storage_path: path, is_public: !!isPublic
            });
        });
    });
};

window.listFiles = function (userId) {
    var uid = userId || (currentSession ? currentSession.user.id : '');
    return supabase.from('private_files').select('*').eq('user_id', uid).order('created_at', { ascending: false });
};

window.toggleFilePublic = function (fileId, value) {
    return supabase.from('private_files').update({ is_public: value }).eq('id', fileId);
};

window.deleteFile = function (fileId, storagePath) {
    return supabase.storage.from('files').remove([storagePath]).then(function () {
        return supabase.from('private_files').delete().eq('id', fileId);
    });
};

window.listForumPosts = function () {
    return supabase.from('forum_posts').select('*, profiles(username, member_id, nickname)').eq('is_public', true).order('created_at', { ascending: false }).limit(20);
};

window.createForumPost = function (title, content, isPublic, weather) {
    return ensureSession().then(function (s) {
        if (!s) throw new Error('not logged in');
        return supabase.from('forum_posts').insert({
            user_id: s.user.id, title: title, content: content,
            is_public: !!isPublic, weather: weather || ''
        });
    });
};

window.getMyPosts = function () {
    return ensureSession().then(function (s) {
        if (!s) throw new Error('not logged in');
        return supabase.from('forum_posts').select('*').eq('user_id', s.user.id).order('created_at', { ascending: false });
    });
};

window.updateForumPost = function (id, data) {
    return supabase.from('forum_posts').update(data).eq('id', id);
};

window.deleteForumPost = function (id) {
    return supabase.from('forum_posts').delete().eq('id', id);
};

function updateUserUI() {
    var btn = document.getElementById('navUserBtn');
    if (!btn) return;
    if (isLogged()) {
        // Create avatar + dropdown
        btn.innerHTML = '<span class="nav-avatar" id="navAvatar"></span><div class="nav-user-dropdown" id="userDropdown" style="display:none"></div>';
        btn.href = 'javascript:void(0)';
        btn.style.position = 'relative';
        var dd = document.getElementById('userDropdown');
        dd.innerHTML = '';
        getProfile().then(function (p) {
            var avatar = document.getElementById('navAvatar');
            if (avatar && p && p.avatar_url) {
                avatar.style.backgroundImage = 'url(' + p.avatar_url + ')';
                avatar.style.backgroundSize = 'cover';
                avatar.textContent = '';
            } else if (avatar) { avatar.textContent = '?'; }
            if (p && p.member_id) {
                var idLink = document.createElement('a');
                idLink.href = 'settings.html';
                idLink.textContent = 'ID: ' + p.member_id;
                dd.appendChild(idLink);
            }
            var setLink = document.createElement('a');
            setLink.href = 'settings.html';
            setLink.textContent = 'Settings';
            dd.appendChild(setLink);
            var logoutLink = document.createElement('a');
            logoutLink.href = 'javascript:void(0)';
            logoutLink.textContent = 'Logout';
            logoutLink.addEventListener('click', function () {
                signOutAll().then(function () {
                    currentSession = null;
                    localStorage.removeItem('akano_auth_email');
                    location.reload();
                });
            });
            dd.appendChild(logoutLink);
        });
        btn.onmouseenter = function () { dd.style.display = 'block'; };
        btn.onmouseleave = function () { dd.style.display = 'none'; };
    } else {
        btn.innerHTML = 'Login';
        btn.href = '#';
        btn.style.position = '';
        btn.onmouseenter = null;
        btn.onmouseleave = null;
        var dd = document.getElementById('userDropdown');
        if (dd) dd.style.display = 'none';
        btn.onclick = function (e) { e.preventDefault();
            if(typeof showLoginModal==='function') showLoginModal();
            else if(window.location.pathname.indexOf('index.html')<0) window.location.href='index.html';
        };
    }
}

(function () {
    var btn = document.getElementById('navUserBtn');
    if (btn && window.location.pathname.indexOf('index.html') < 0) {
        btn.onclick = function (e) { e.preventDefault(); window.location.href = 'index.html'; };
    }
})();
setTimeout(updateUserUI, 500);
