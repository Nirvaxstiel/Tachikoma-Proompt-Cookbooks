"""
Skill Indexer
Builds and maintains skill index for discovery

Purpose: Easier skill discovery for agents and users
Based on: Common software patterns and best practices
"""

import os
import json
import re
import yaml
from datetime import datetime
from typing import List, Dict, Optional, Set
from pathlib import Path


class SkillIndexer:
    """Build and maintain skill index for discovery"""

    def __init__(self, skills_dir: str = '.opencode/skills/', index_path: str = '.opencode/cache/skill-index.json'):
        """
        Initialize skill indexer

        Args:
            skills_dir: Directory containing skill subdirectories
            index_path: Path to store index file
        """
        self.skills_dir = skills_dir
        self.index_path = index_path
        self.index = self._load_or_build_index()
        self._ensure_cache_dir()

    def _ensure_cache_dir(self):
        """Ensure cache directory exists"""
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)

    def _load_or_build_index(self) -> Dict:
        """Load existing index or build from skills directory"""
        # Ensure cache directory exists first
        cache_dir = os.path.dirname(self.index_path)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)

        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                # Corrupted index, rebuild
                return self._build_index()
        return self._build_index()

    def _build_index(self) -> Dict:
        """Build skill index from all skills"""
        index = {
            'skills': [],
            'categories': {},
            'tags': {},
            'last_updated': datetime.now().isoformat(),
            'total_skills': 0
        }

        if not os.path.exists(self.skills_dir):
            return index

        for skill_dir in os.listdir(self.skills_dir):
            skill_path = os.path.join(self.skills_dir, skill_dir)

            # Skip non-directories
            if not os.path.isdir(skill_path):
                continue

            # Check for SKILL.md
            manifest_path = os.path.join(skill_path, 'SKILL.md')
            if not os.path.exists(manifest_path):
                continue

            # Parse manifest
            skill_entry = self._parse_manifest(manifest_path, skill_dir)
            if skill_entry:
                index['skills'].append(skill_entry)

                # Build category index (store full skill entries)
                category = skill_entry.get('category', 'uncategorized')
                if category not in index['categories']:
                    index['categories'][category] = []
                index['categories'][category].append(skill_entry)

                # Build tag index (store full skill entries)
                for tag in skill_entry.get('tags', []):
                    if tag not in index['tags']:
                        index['tags'][tag] = []
                    index['tags'][tag].append(skill_entry)

        index['total_skills'] = len(index['skills'])
        self._save_index(index)
        return index

    def _parse_manifest(self, manifest_path: str, skill_dir: str) -> Optional[Dict]:
        """
        Parse skill manifest (SKILL.md)

        Args:
            manifest_path: Path to SKILL.md file
            skill_dir: Directory name of skill

        Returns:
            Skill entry dictionary or None if parsing fails
        """
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse frontmatter (YAML-like section between ---)
            if content.startswith('---'):
                # Find end of frontmatter
                end_match = re.search(r'\n---\n', content)
                if end_match:
                    frontmatter = content[:end_match.start()]
                    remaining = content[end_match.end():]
                else:
                    frontmatter = content
                    remaining = content[3:]
            else:
                frontmatter = ''
                remaining = content

            # Parse frontmatter lines
            frontmatter_lines = [line.strip() for line in frontmatter.split('\n') if line.strip() and not line.startswith('#')]

            metadata = {}
            for line in frontmatter_lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    # Remove quotes if present
                    value = value.strip().strip('"').strip("'")
                    metadata[key] = value
                elif '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    metadata[key] = value

            # Build skill entry
            skill_entry = {
                'name': metadata.get('name', skill_dir.replace('-', ' ').title()),
                'directory': skill_dir,
                'version': metadata.get('version', '0.0.0'),
                'description': metadata.get('description', ''),
                'category': metadata.get('category', 'uncategorized'),
                'tags': self._parse_tags(metadata.get('tag', [])),
                'deprecated': metadata.get('deprecated', 'false').lower() in ['true', 'yes', '1', 'on'],
                'author': metadata.get('author', 'unknown'),
                'last_updated': datetime.now().isoformat()
            }

            return skill_entry

        except Exception as e:
            print(f"Warning: Failed to parse manifest for {skill_dir}: {e}")
            return None

    def _parse_tags(self, tags) -> List[str]:
        """Parse tags field (can be single string or list)"""
        if isinstance(tags, list):
            return tags
        elif isinstance(tags, str):
            return [tag.strip() for tag in tags.split(',') if tag.strip()]
        else:
            return []

    def _save_index(self, index: Dict):
        """Save index to file"""
        index['last_updated'] = datetime.now().isoformat()
        with open(self.index_path, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2)

    def rebuild_index(self) -> Dict:
        """Force rebuild of skill index"""
        self.index = self._build_index()
        return self.index

    def search_skills(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search skills by name, description, or tags

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of matching skills with relevance scores
        """
        query_lower = query.lower()
        scored_skills = []

        for skill in self.index['skills']:
            score = 0

            # Name match (highest weight)
            if query_lower in skill['name'].lower():
                score += 10

            # Description match
            if query_lower in skill['description'].lower():
                score += 5

            # Tag matches
            for tag in skill['tags']:
                if query_lower in tag.lower():
                    score += 3

            # Directory name match
            if query_lower in skill['directory'].lower():
                score += 3

            # Category match
            if query_lower in skill['category'].lower():
                score += 4

            if score > 0:
                scored_skills.append((skill, score))

        # Sort by score
        scored_skills.sort(key=lambda x: x[1], reverse=True)

        return [skill for skill, score in scored_skills[:limit]]

    def get_skills_by_category(self, category: str) -> List[Dict]:
        """
        Get all skills in a category

        Args:
            category: Category name

        Returns:
            List of skills in category
        """
        category_lower = category.lower()
        category_skills = self.index.get('categories', {}).get(category_lower, [])
        # Return list of skill entries
        return category_skills if isinstance(category_skills, list) else []

    def get_skills_by_tag(self, tag: str) -> List[Dict]:
        """
        Get all skills with a specific tag

        Args:
            tag: Tag name

        Returns:
            List of skills with tag
        """
        tag_lower = tag.lower()
        tag_skills = self.index.get('tags', {}).get(tag_lower, [])
        # Return list of skill entries
        return tag_skills if isinstance(tag_skills, list) else []

    def get_skill_by_name(self, name: str) -> Optional[Dict]:
        """
        Get skill by exact name match

        Args:
            name: Skill name

        Returns:
            Skill entry or None if not found
        """
        name_lower = name.lower()
        for skill in self.index['skills']:
            if skill['name'].lower() == name_lower:
                return skill
        return None

    def get_index_stats(self) -> Dict:
        """Get statistics about the skill index"""
        categories = list(self.index['categories'].keys())
        tags = list(self.index['tags'].keys())

        # Count deprecated skills
        deprecated_count = sum(1 for skill in self.index['skills'] if skill.get('deprecated', False))

        # Calculate category counts properly
        category_counts = {}
        for cat, skills_list in self.index['categories'].items():
            if isinstance(skills_list, list):
                category_counts[cat] = len(skills_list)
            else:
                category_counts[cat] = 1

        # Calculate tag counts properly
        tag_counts = {}
        for tag, skills_list in self.index['tags'].items():
            if isinstance(skills_list, list):
                tag_counts[tag] = len(skills_list)
            else:
                tag_counts[tag] = 1

        return {
            'total_skills': self.index['total_skills'],
            'total_categories': len(categories),
            'total_tags': len(tags),
            'deprecated_skills': deprecated_count,
            'last_updated': self.index['last_updated'],
            'categories': category_counts,
            'tags': tag_counts
        }

    def add_skill_to_index(self, skill_dir: str) -> bool:
        """
        Add a new skill to the index

        Args:
            skill_dir: Directory name of skill

        Returns:
            True if added successfully, False otherwise
        """
        skill_path = os.path.join(self.skills_dir, skill_dir)
        manifest_path = os.path.join(skill_path, 'SKILL.md')

        if not os.path.exists(manifest_path):
            return False

        skill_entry = self._parse_manifest(manifest_path, skill_dir)
        if not skill_entry:
            return False

        # Check if already in index
        for skill in self.index['skills']:
            if skill['directory'] == skill_dir:
                return False

        # Add to index
        self.index['skills'].append(skill_entry)
        self.index['total_skills'] = len(self.index['skills'])

        # Update category index (store full skill entries)
        category = skill_entry.get('category', 'uncategorized')
        if category not in self.index['categories']:
            self.index['categories'][category] = []
        self.index['categories'][category].append(skill_entry)

        # Update tag index (store full skill entries)
        for tag in skill_entry.get('tags', []):
            if tag not in self.index['tags']:
                self.index['tags'][tag] = []
            self.index['tags'][tag].append(skill_entry)

        self._save_index(self.index)
        return True


# Singleton instance
_indexer_instance = None


def get_skill_indexer(
    skills_dir: str = '.opencode/skills/',
    index_path: str = '.opencode/cache/skill-index.json'
) -> SkillIndexer:
    """Get singleton skill indexer instance"""
    global _indexer_instance

    if _indexer_instance is None:
        _indexer_instance = SkillIndexer(skills_dir, index_path)

    return _indexer_instance


# CLI interface
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Skill Indexer')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Build command
    build_parser = subparsers.add_parser('build', help='Build skill index')
    build_parser.add_argument('--force', action='store_true', help='Force rebuild')

    # Search command
    search_parser = subparsers.add_parser('search', help='Search skills')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--limit', type=int, default=10, help='Max results')

    # Category command
    category_parser = subparsers.add_parser('category', help='Get skills by category')
    category_parser.add_argument('category', help='Category name')

    # Tag command
    tag_parser = subparsers.add_parser('tag', help='Get skills by tag')
    tag_parser.add_argument('tag', help='Tag name')

    # Stats command
    subparsers.add_parser('stats', help='Get index statistics')

    args = parser.parse_args()

    indexer = get_skill_indexer()

    if args.command == 'build':
        if args.force:
            print("Rebuilding skill index...")
            indexer.rebuild_index()
            print(f"Index built with {indexer.index['total_skills']} skills")
        else:
            print(f"Index has {indexer.index['total_skills']} skills")
            print(f"Last updated: {indexer.index['last_updated']}")

    elif args.command == 'search':
        results = indexer.search_skills(args.query, args.limit)
        print(f"\n=== SEARCH RESULTS: '{args.query}' ===")
        if results:
            for i, skill in enumerate(results, 1):
                tags = ', '.join(skill['tags'])
                print(f"\n{i}. {skill['name']} v{skill['version']}")
                print(f"   Category: {skill['category']}")
                print(f"   Tags: {tags}")
                print(f"   Description: {skill['description'][:80]}")
                print(f"   Deprecated: {'Yes' if skill['deprecated'] else 'No'}")
            print(f"\nTotal: {len(results)} results")
        else:
            print("No matching skills found.")

    elif args.command == 'category':
        skills = indexer.get_skills_by_category(args.category)
        print(f"\n=== SKILLS IN CATEGORY: '{args.category}' ===")
        if skills:
            for skill in skills:
                print(f"  - {skill['name']} v{skill['version']}")
                if skill['deprecated']:
                    print(f"    [DEPRECATED]")
            print(f"\nTotal: {len(skills)} skills")
        else:
            print(f"No skills found in category '{args.category}'")

    elif args.command == 'tag':
        skills = indexer.get_skills_by_tag(args.tag)
        print(f"\n=== SKILLS WITH TAG: '{args.tag}' ===")
        if skills:
            for skill in skills:
                print(f"  - {skill['name']} v{skill['version']}")
                if skill['deprecated']:
                    print(f"    [DEPRECATED]")
            print(f"\nTotal: {len(skills)} skills")
        else:
            print(f"No skills found with tag '{args.tag}'")

    elif args.command == 'stats':
        stats = indexer.get_index_stats()
        print("\n=== SKILL INDEX STATISTICS ===")
        print(f"Total skills: {stats['total_skills']}")
        print(f"Total categories: {stats['total_categories']}")
        print(f"Total tags: {stats['total_tags']}")
        print(f"Deprecated skills: {stats['deprecated_skills']}")
        print(f"Last updated: {stats['last_updated']}")

        if stats.get('categories'):
            print("\nCategories:")
            for cat, skills_list in stats['categories'].items():
                # Handle both list (skill names) and dict entries
                if isinstance(skills_list, list):
                    # List of skill entries
                    count = len(skills_list)
                    names = [s['name'] if isinstance(s, dict) else s for s in skills_list]
                    if names:
                        print(f"  - {cat}: {count} skills ({', '.join(names[:3])}...)" if count > 3 else f"  - {cat}: {count} skills ({', '.join(names)})")
                    else:
                        print(f"  - {cat}: 0 skills")
                else:
                    # Unexpected format
                    print(f"  - {cat}: {skills_list}")

        if stats.get('tags'):
            print("\nTags:")
            for tag, skills_list in stats['tags'].items():
                # Handle both list (skill entries) and dict entries
                if isinstance(skills_list, list):
                    count = len(skills_list)
                    names = [s['name'] if isinstance(s, dict) else s for s in skills_list]
                    if names:
                        print(f"  - {tag}: {count} skills ({', '.join(names[:3])}...)" if count > 3 else f"  - {tag}: {count} skills ({', '.join(names)})")
                    else:
                        print(f"  - {tag}: 0 skills")

    else:
        parser.print_help()
