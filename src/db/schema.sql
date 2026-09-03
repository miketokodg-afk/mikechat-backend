-- Utilisateurs (identifiés par numéro de téléphone)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) DEFAULT 'Nouvel utilisateur',
  avatar_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations (privées ou de groupe)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  is_group BOOLEAN DEFAULT FALSE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Statuts (gratuits 24h ou boostés 2 mois)
CREATE TABLE IF NOT EXISTS statuses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT,
  caption TEXT,
  is_boosted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Paiements Paydounia (PayDunya) pour les statuts boostés
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status_id INTEGER REFERENCES statuses(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL DEFAULT 3000,
  currency VARCHAR(10) DEFAULT 'FCFA',
  paydunya_token TEXT,
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vidéos courtes
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
