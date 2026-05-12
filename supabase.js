var SUPABASE_URL = 'https://izhojeyadxffzxukgonj.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6aG9qZXlhZHhmZnp4dWtnb25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAzNDgsImV4cCI6MjA5NDE3NjM0OH0.vvE-vd9Om0vl9BtJFpNCUagNOPvE8abfyJyfg2e_vZs';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.getProfile = function () {
    var session = supabase.auth.session();
    if (!session) return Promise.resolve(null);
    return supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(function (r) { return r.data; })
        .catch(function () { return null; });
};

window.getSession = function () {
    return supabase.auth.session();
};

window.isLogged = function () {
    return !!supabase.auth.session();
};

window.signUpEmail = function (email, password, username) {
    return supabase.auth.signUp({ email: email, password: password }).then(function (r) {
        if (r.user) {
            return supabase.from('profiles').upsert({
                id: r.user.id, username: username, nickname: username
            }).then(function () { return { ok: true, user: r.user }; });
        }
        return { ok: false, error: r.error ? r.error.message : '注册失败' };
    });
};

window.signInEmail = function (email, password) {
    return supabase.auth.signIn({ email: email, password: password }).then(function (r) {
        if (r.user) return { ok: true, user: r.user };
        return { ok: false, error: r.error ? r.error.message : '登录失败' };
    });
};

window.signOutAll = function () {
    return supabase.auth.signOut();
};

window.updateProfile = function (data) {
    var session = supabase.auth.session();
    if (!session) return Promise.reject('未登录');
    return supabase.from('profiles').update(data).eq('id', session.user.id);
};

window.uploadAvatar = function (file) {
    var session = supabase.auth.session();
    if (!session) return Promise.reject('未登录');
    var ext = file.name.split('.').pop();
    var path = session.user.id + '/avatar.' + ext;
    return supabase.storage.from('avatars').upload(path, file, { upsert: true }).then(function (r) {
        if (r.error) throw r.error;
        var url = SUPABASE_URL + '/storage/v1/object/public/avatars/' + path;
        return supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id).then(function () {
            return url;
        });
    });
};

window.uploadFile = function (file, isPublic) {
    var session = supabase.auth.session();
    if (!session) return Promise.reject('未登录');
    var path = session.user.id + '/' + Date.now() + '_' + file.name;
    return supabase.storage.from('files').upload(path, file).then(function (r) {
        if (r.error) throw r.error;
        var url = SUPABASE_URL + '/storage/v1/object/public/files/' + path;
        return supabase.from('private_files').insert({
            user_id: session.user.id,
            filename: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: path,
            is_public: !!isPublic
        }).then(function () { return url; });
    });
};

window.listFiles = function (userId) {
    return supabase.from('private_files').select('*').eq('user_id', userId || '')
        .order('created_at', { ascending: false });
};

window.toggleFilePublic = function (fileId, value) {
    return supabase.from('private_files').update({ is_public: value }).eq('id', fileId);
};

window.deleteFile = function (fileId, storagePath) {
    return supabase.storage.from('files').remove([storagePath]).then(function () {
        return supabase.from('private_files').delete().eq('id', fileId);
    });
};

window.listForumPosts = function (page, size, search) {
    var q = supabase.from('forum_posts').select('*, profiles(username, member_id, avatar_url, nickname)')
        .eq('is_public', true).order('created_at', { ascending: false });
    if (search) q = q.or('title.ilike.%' + search + '%,content.ilike.%' + search + '%');
    var from = (page - 1) * (size || 10);
    var to = from + (size || 10) - 1;
    return q.range(from, to);
};

window.createForumPost = function (title, content, isPublic, weather) {
    var session = supabase.auth.session();
    if (!session) return Promise.reject('未登录');
    return supabase.from('forum_posts').insert({
        user_id: session.user.id,
        title: title,
        content: content,
        is_public: !!isPublic,
        weather: weather || ''
    });
};

window.updateForumPost = function (id, data) {
    return supabase.from('forum_posts').update(data).eq('id', id);
};

window.deleteForumPost = function (id) {
    return supabase.from('forum_posts').delete().eq('id', id);
};

window.getMyPosts = function () {
    var session = supabase.auth.session();
    if (!session) return Promise.reject('未登录');
    return supabase.from('forum_posts').select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
};

// 监听认证状态变化
supabase.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN') {
        localStorage.setItem('akano_auth_email', session.user.email);
        updateUserUI();
    } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('akano_auth_email');
        updateUserUI();
    }
});

function updateUserUI() {
    var btn = document.getElementById('navUserBtn');
    if (!btn) return;
    if (isLogged()) {
        btn.innerHTML = '<span class="nav-avatar" id="navAvatar"></span>';
        getProfile().then(function (p) {
            var avatar = document.getElementById('navAvatar');
            if (avatar && p && p.avatar_url) {
                avatar.style.backgroundImage = 'url(' + p.avatar_url + ')';
                avatar.style.backgroundSize = 'cover';
                avatar.textContent = '';
            } else if (avatar) {
                avatar.textContent = '?';
            }
        });
        btn.href = 'settings.html';
        btn.onclick = null;
    } else {
        btn.innerHTML = '登录';
        btn.href = '#';
        btn.onclick = function (e) { e.preventDefault();
            if(typeof showLoginModal==='function')showLoginModal();else window.location.href='index.html'; };
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

setTimeout(updateUserUI, 500);
