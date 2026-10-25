import json
import os

DICT_FILE = os.path.join(os.path.dirname(__file__), 'data', 'isl_dictionary.json')

class ISLDictionaryManager:
    def __init__(self):
        self.data = self._load_data()

    def _load_data(self):
        if not os.path.exists(DICT_FILE):
            print(f"Warning: Dictionary file not found at {DICT_FILE}")
            return {"categories": [], "entries": []}
        try:
            with open(DICT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading dictionary file: {e}")
            return {"categories": [], "entries": []}

    def get_categories(self):
        return self.data.get('categories', [])

    def get_metadata(self):
        return {
            'version': self.data.get('version', '1.0'),
            'name': self.data.get('name', ''),
            'description': self.data.get('description', ''),
            'attribution': self.data.get('attribution', ''),
            'total_entries': len(self.data.get('entries', []))
        }

    def get_all_entries(self):
        return self.data.get('entries', [])

    def search(self, query='', category=None):
        entries = self.data.get('entries', [])
        q = (query or '').strip().lower()
        cat = (category or '').strip()

        results = []
        for item in entries:
            # Filter by category if specified
            if cat and cat != 'All' and item.get('category') != cat:
                continue

            # If query specified, check gloss, english_meaning, hindi_label, tags
            if q:
                gloss = item.get('gloss', '').lower()
                meaning = item.get('english_meaning', '').lower()
                hindi = item.get('hindi_label', '').lower()
                tags = [t.lower() for t in item.get('tags', [])]

                if (q in gloss or q in meaning or q in hindi or any(q in t for t in tags)):
                    results.append(item)
            else:
                results.append(item)

        return results

    def get_entry_by_id(self, entry_id):
        for item in self.data.get('entries', []):
            if item.get('id') == entry_id:
                return item
        return None

    def get_entry_by_gloss(self, gloss):
        g = gloss.strip().upper()
        for item in self.data.get('entries', []):
            if item.get('gloss', '').upper() == g:
                return item
        return None

# Singleton instance
dictionary_manager = ISLDictionaryManager()
