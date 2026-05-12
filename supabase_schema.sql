-- ========== 数据库建表 ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    member_id TEXT UNIQUE,
    nickname TEXT DEFAULT '',
    bio TEXT DEFAULT '' CHECK (char_length(bio) <= 50),
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.member_id_seq START 1;
ALTER TABLE public.profiles ALTER COLUMN member_id
  SET DEFAULT lpad(nextval('public.member_id_seq')::text, 5, '0');

-- 论坛帖子表
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT true,
    weather TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 私人文件表
CREATE TABLE IF NOT EXISTS public.private_files (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT DEFAULT '',
    file_size BIGINT DEFAULT 0,
    storage_path TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== RLS 权限策略 ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_files ENABLE ROW LEVEL SECURITY;

-- profes: 所有人读，本人写
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- forum_posts: 公开帖所有人读，本人全权
CREATE POLICY "forum_select" ON public.forum_posts FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "forum_insert" ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_update" ON public.forum_posts FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "forum_delete" ON public.forum_posts FOR DELETE
  USING (auth.uid() = user_id);

-- private_files: 本人读写，公开文件所有人可读
CREATE POLICY "files_select" ON public.private_files FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "files_insert" ON public.private_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "files_update" ON public.private_files FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "files_delete" ON public.private_files FOR DELETE
  USING (auth.uid() = user_id);

-- ========== 触发器：注册时自动创建 profile ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
