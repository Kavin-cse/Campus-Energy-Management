import os
import json
import logging
try:
    import firebase_admin
    from firebase_admin import credentials, db
    HAS_FIREBASE = True
except ImportError:
    HAS_FIREBASE = False

logger = logging.getLogger(__name__)

class MockFirebaseDB:
    """A simple in-memory mock for Firebase Realtime Database for simulation mode."""
    def __init__(self):
        self._data = {
            "campusEnergy": {
                "devices": {},
                "readings": {},
                "occupancy": {}
            }
        }

    def _get_node(self, path):
        parts = path.strip("/").split("/")
        current = self._data
        for part in parts:
            if not part:
                continue
            if part not in current:
                current[part] = {}
            current = current[part]
        return current

    def _set_node(self, path, value):
        parts = path.strip("/").split("/")
        current = self._data
        for i, part in enumerate(parts):
            if not part:
                continue
            if i == len(parts) - 1:
                current[part] = value
            else:
                if part not in current or not isinstance(current[part], dict):
                    current[part] = {}
                current = current[part]

    def _update_node(self, path, value):
        node = self._get_node(path)
        if isinstance(node, dict) and isinstance(value, dict):
            node.update(value)
        else:
            self._set_node(path, value)

    def get(self, path):
        return self._get_node(path)

    def set(self, path, value):
        self._set_node(path, value)

    def update(self, path, value):
        self._update_node(path, value)

    def push(self, path, value):
        node = self._get_node(path)
        import uuid
        new_key = str(uuid.uuid4())
        if not isinstance(node, dict):
            self._set_node(path, {new_key: value})
        else:
            node[new_key] = value
        return type('MockRef', (), {'key': new_key})()


class FirebaseService:
    def __init__(self):
        self.mock_mode = os.getenv("FIREBASE_MOCK_MODE", "true").lower() == "true"
        self.mock_db = MockFirebaseDB() if self.mock_mode else None
        
        if not self.mock_mode and HAS_FIREBASE:
            try:
                # Attempt to initialize Firebase with credentials
                cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
                db_url = os.getenv("FIREBASE_DATABASE_URL")
                if cred_path and os.path.exists(cred_path):
                    if not firebase_admin._apps:
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred, {
                            'databaseURL': db_url
                        })
                    logger.info("Firebase Admin initialized successfully.")
                else:
                    logger.warning("Firebase credentials not found. Falling back to Mock Mode.")
                    self.mock_mode = True
                    self.mock_db = MockFirebaseDB()
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {e}. Falling back to Mock Mode.")
                self.mock_mode = True
                self.mock_db = MockFirebaseDB()
        elif not HAS_FIREBASE:
            logger.warning("firebase_admin not installed. Forcing Mock Mode.")
            self.mock_mode = True
            if not self.mock_db:
                self.mock_db = MockFirebaseDB()

    def get_ref(self, path):
        if self.mock_mode or not HAS_FIREBASE:
            return type('MockDBRef', (), {
                'get': lambda: self.mock_db.get(path),
                'set': lambda v: self.mock_db.set(path, v),
                'update': lambda v: self.mock_db.update(path, v),
                'push': lambda v: self.mock_db.push(path, v)
            })()
        else:
            return db.reference(path)

firebase_service = FirebaseService()
