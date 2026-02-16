"""
Skill Version Manager
Manages skill versions and deprecation for Tachikoma

Purpose: Maintainability for evolving skill ecosystem
Based on: Common software patterns and versioning best practices
"""

import re
import os
import json
from typing import Dict, List, Optional
from datetime import datetime


class SkillVersionManager:
    """Manage skill versions and deprecation"""

    def __init__(self):
        self.skills_dir = '.opencode/skills/'
        self._cache = {}  # Cache for skill metadata

    def _load_skill_manifest(self, skill_name: str) -> Optional[Dict]:
        """Load and parse skill manifest (SKILL.md)"""
        manifest_path = os.path.join(self.skills_dir, skill_name, 'SKILL.md')
        
        if not os.path.exists(manifest_path):
            return None
        
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
                
                return metadata
        except Exception as e:
            print(f"Warning: Failed to parse manifest for {skill_name}: {e}")
            return None

    def get_skill_version(self, skill_name: str) -> str:
        """
        Read version from skill manifest
        
        Args:
            skill_name: Name of skill
        
        Returns:
            Version string (e.g., "1.2.0") or "0.0.0" if not found
        """
        metadata = self._load_skill_manifest(skill_name)
        
        if metadata and 'version' in metadata:
            return metadata['version']
        else:
            return '0.0.0'

    def get_skill_name(self, skill_name: str) -> str:
        """
        Read name from skill manifest
        
        Args:
            skill_name: Directory name of skill
            
        Returns:
            Name from manifest or directory name if not found
        """
        metadata = self._load_skill_manifest(skill_name)
        
        if metadata and 'name' in metadata:
            return metadata['name']
        else:
            # Use directory name as fallback
            return skill_name

    def get_skill_description(self, skill_name: str) -> str:
        """
        Read description from skill manifest
        
        Args:
            skill_name: Name of skill
            
        Returns:
            Description or empty string
        """
        metadata = self._load_skill_manifest(skill_name)
        
        if metadata and 'description' in metadata:
            return metadata['description']
        else:
            return ""

    def get_skill_tags(self, skill_name: str) -> List[str]:
        """
        Read tags from skill manifest

        Args:
            skill_name: Name of skill

        Returns:
            List of tags
        """
        metadata = self._load_skill_manifest(skill_name)

        if metadata and 'tag' in metadata:
            if isinstance(metadata['tag'], list):
                return metadata['tag']
            elif metadata['tag']:
                return [metadata['tag']]
            else:
                return []
        return []

    def is_deprecated(self, skill_name: str) -> bool:
        """
        Check if skill is deprecated
        
        Args:
            skill_name: Name of skill
            
        Returns:
            True if deprecated, False otherwise
        """
        metadata = self._load_skill_manifest(skill_name)
        
        if metadata:
            # Check for deprecation flag
            if 'deprecated' in metadata:
                return metadata['deprecated'].lower() in ['true', 'yes', '1', 'on']
            # Also check for tags
            tags = self.get_skill_tags(skill_name)
            return 'deprecated' in tags

    def warn_on_deprecated_skill(self, skill_name: str) -> str:
        """
        Return warning message if skill is deprecated
        
        Args:
            skill_name: Name of skill
            
        Returns:
            Warning message or empty string
        """
        version = self.get_skill_version(skill_name)
        if self.is_deprecated(skill_name):
            return f"⚠️  Warning: Skill '{skill_name}' v{version} is deprecated. Consider using an alternative."
        return ""

    def get_all_skills(self) -> List[Dict[str, any]]:
        """
        List all skills with their metadata
        
        Returns:
            List of skill dictionaries
        """
        skills = []
        
        if not os.path.exists(self.skills_dir):
            return skills
        
        for skill_dir in os.listdir(self.skills_dir):
            # Skip directories
            skill_path = os.path.join(self.skills_dir, skill_dir)
            if not os.path.isdir(skill_path):
                continue
            
            # Check for SKILL.md
            skill_path = os.path.join(skill_dir, 'SKILL.md')
            if not os.path.exists(skill_path):
                continue
            
            skill_name = skill_dir
            metadata = self._load_skill_manifest(skill_name)
            
            if not metadata:
                # Create minimal metadata from directory name
                name = skill_dir.replace('-', ' ').title()
                metadata = {
                    'name': name,
                    'version': '0.0.0',
                    'description': '',
                    'deprecated': False
                }
            
            # Add to list
            skills.append(metadata)
        
        return skills

    def get_skill_dependencies(self, skill_name: str) -> List[str]:
        """
        Analyze skill to find dependencies (skills it imports)
        
        Args:
            skill_name: Name of skill
            
        Returns:
            List of skill names this skill depends on
        """
        metadata = self._load_skill_manifest(skill_name)
        if not metadata:
            return []
        
        # SKILL.md file path
        skill_path = os.path.join(self.skills_dir, skill_name, 'SKILL.md')
        
        if not os.path.exists(skill_path):
            return []
        
        # Look for dependency patterns
        dependencies = set()
        
        try:
            with open(skill_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Look for common dependency patterns
            # Pattern 1: Use @skill-name syntax
            dependency_patterns = [
                r'@([\w-]+)'  # References other skills by name
            ]
            
            for pattern in dependency_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    skill_name_match = match.strip('@').split('(')[0].strip()
                    if skill_name_match and skill_name_match != skill_name:
                        dependencies.add(skill_name_match)
        except Exception:
            pass
        
        return sorted(list(dependencies))

    def compare_versions(self, skill1: str, skill2: str) -> int:
        """
        Compare two skill versions
        
        Returns:
            -1 if skill1 < skill2, 0 if equal, 1 if skill1 > skill2
        """
        version1 = self.get_skill_version(skill1)
        version2 = self.get_skill_version(skill2)
        
        try:
            parts1 = version1.split('.')
            parts2 = version2.split('.')
        # Compare as tuples
            for i in range(max(len(parts1), len(parts2))):
                if int(parts1[i]) < int(parts2[i]):
                    return -1
                elif int(parts1[i]) > int(parts2[i]):
                    return 1
            
            return 0
        except:
            return 0

    def get_skill_compatibility(self, skill_name: str, current_version: str) -> Dict[str, any]:
        """
        Check skill compatibility with current version
        
        Returns:
            Dictionary with compatibility info
        """
        # Get all skills
        all_skills = self.get_all_skills()
        
        # Build dependency graph
        skill_dependencies = {}
        for skill in all_skills:
            name = skill['name']
            deps = self.get_skill_dependencies(name)
            skill_dependencies[name] = deps
        
        compatibility = {
            'can_load': True,
            'dependencies': [],
            'in_conflict': [],
            'notes': []
        }
        
        # Check if skill has unmet dependencies
        deps = skill_dependencies.get(skill_name, [])
        if deps:
            for dep in deps:
                if dep not in [s['name'] for s in all_skills]:
                    compatibility['dependencies'].append(dep)
                    compatibility['can_load'] = False
        
        return compatibility

    def check_deprecation_impact(self, skill_name: str) -> Dict[str, any]:
        """
        Analyze impact of skill deprecation
        
        Returns:
            Dictionary with impact analysis
        """
        all_skills = self.get_all_skills()
        
        # Find skills that depend on this one
        dependents = []
        for skill in all_skills:
            deps = self.get_skill_dependencies(skill['name'])
            if skill_name in deps:
                dependents.append(skill['name'])
        
        version = self.get_skill_version(skill_name)
        
        return {
            'dependent_skills': dependents,
            'dependent_count': len(dependents),
            'recommendation': 'or provide migration guide' if len(dependents) > 0 else 'No dependents',
            'version': version
        }

    def format_version_warning(self, skill_name: str, current_version: str) -> str:
        """
        Format version mismatch warning
        
        Args:
            skill_name: Name of skill
            current_version: Current version being used
            
        Returns:
            Formatted warning message
        """
        skill_version = self.get_skill_version(skill_name)
        
        if skill_version == current_version:
            return ""
        
        try:
            comparison = self.compare_versions(skill_version, current_version)
            if comparison < 0:
                return f"⚠️  Warning: Using {current_version} but '{skill_name}' is v{skill_version} (newer version available)"
            elif comparison > 0:
                return f"⚠️  Warning: Using {current_version} but '{skill_name}' is v{skill_version} (older version)"
            return ""
        except:
            return ""

    def generate_migration_guide(self, old_skill: str, new_skill: str) -> str:
        """
        Generate migration guide from old to new skill
        
        Args:
            old_skill: Old skill name
            new_skill: New skill name
            
        Returns:
            Migration guide markdown
        """
        # This is a placeholder - would need to analyze both skills
        return f"# Migration Guide: {old_skill} → {new_skill}\n\n## Breaking Changes\n- See documentation for details\n## Migration Steps\n1. Update imports\n2. Update function calls\n3. Test thoroughly\n\n## Rollback\n- Use git if issues arise\n"

    def create_version_release_notes(
        self,
        skill_name: str,
        old_version: str,
        new_version: str,
        changes: List[str]
    ) -> str:
        """
        Generate release notes for version update
        
        Args:
            skill_name: Skill name
            old_version: Previous version
            new_version: New version
            changes: List of changes
            
        Returns:
            Markdown formatted release notes
        """
        release_notes = f"""# Release Notes: {skill_name} {new_version}

Released: {datetime.now().strftime('%Y-%m-%d')}

## Changes from {old_version}

"""
        
        for i, change in enumerate(changes, 1):
            release_notes += f"{i}. {change}\n"
        
        release_notes += f"\n## Upgrade Guide\n\n### Backward Compatibility\n"
        release_notes += f"- This version maintains backward compatibility with v{old_version}\n"
        release_notes += f"- Follow the documentation for upgrade instructions\n\n\n## Features\n\n"
        release_notes += f"- See the skill's SKILL.md for new features\n\n"
        release_notes += f"- Bug fixes and improvements\n"
        
        return release_notes

    def validate_manifest(self, skill_name: str) -> Dict[str, any]:
        """
        Validate skill manifest structure and required fields
        
        Args:
            skill_name: Name of skill
            
        Returns:
            Dictionary with validation results
        """
        manifest_path = os.path.join(self.skills_dir, skill_name, 'SKILL.md')
        
        if not os.path.exists(manifest_path):
            return {
                'valid': False,
                'errors': ['Manifest not found'],
                'warnings': []
            }
        
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return {
                'valid': False,
                'errors': ['Failed to read manifest'],
                'warnings': []
            }
        
        errors = []
        warnings = []
        
        # Check for required fields
        required_fields = ['name', 'description']
        
        # Check if frontmatter exists
        if not content.startswith('---'):
            errors.append("Missing frontmatter section (should start with ---)")
        
        # Parse and validate
        metadata = self._load_skill_manifest(skill_name)
        
        if not metadata:
            return {
                'valid': False,
                'errors': errors + ['Failed to parse metadata'],
                'warnings': warnings
            }
        
        # Check required fields
        for field in required_fields:
            if field not in metadata:
                errors.append(f"Missing required field: {field}")
        
        # Check version format
        if 'version' in metadata:
            version = metadata['version']
            if not re.match(r'^\d+\.\d+\.\d+$', version):
                errors.append(f"Invalid version format: {version} (should be X.Y.Z)")
            else:
                # Check semantic versioning
                parts = [int(p) for p in version.split('.')]
                if len(parts) != 3:
                    warnings.append(f"Version {version} should be MAJOR.MINOR.PATCH format")
        
        # Check for common issues
        if 'description' in metadata and not metadata['description'].strip():
            warnings.append("Description is empty or whitespace only")
        
        if 'deprecated' in metadata and metadata['deprecated'] not in [False, 'false', '0', 'no', 'off']:
            errors.append(f"Deprecated field should be boolean")
        
        is_valid = len(errors) == 0
        is_complete = len(warnings) == 0
        
        return {
            'valid': is_valid and is_complete,
            'errors': errors,
            'warnings': warnings,
            'metadata': metadata
        }

    def scan_for_orphaned_skills(self) -> List[str]:
        """
        Scan for skill directories without SKILL.md
        
        Returns:
            List of orphaned skill directory names
        """
        orphaned = []
        
        if not os.path.exists(self.skills_dir):
            return orphaned
        
        for item in os.listdir(self.skills_dir):
            item_path = os.path.join(self.skills_dir, item)
            
            # Skip non-directories
            if not os.path.isdir(item_path):
                continue
            
            # Check for SKILL.md
            skill_path = os.path.join(item_path, 'SKILL.md')
            if not os.path.exists(skill_path):
                orphaned.append(item)
        
        return orphaned

    def get_skill_index(self) -> Dict[str, Dict[str, any]]:
        """
        Build skill index for all skills
        
        Returns:
            Dictionary indexed by skill name and metadata field
        """
        all_skills = self.get_all_skills()
        index = {}
        
        for skill in all_skills:
            name = skill['name']
            version = skill.get('version', '0.0.0')
            description = skill.get('description', '')
            tags = skill.get('tag', [])
            deprecated = skill.get('deprecated', False)
            
            index[name] = {
                'name': name,
                'version': version,
                'description': description,
                'tags': tags,
                'deprecated': deprecated,
                'directory': name
            }
            
            # Build tag index
            for tag in tags:
                if tag not in index:
                    index[tag] = []
                index[tag].append(name)
        
        return index

    def get_version_history(self, skill_name: str) -> List[Dict[str, any]]:
        """
        Get version history for a skill (placeholder for future)
        
        Returns:
            List of version entries
        """
        # This would require a proper database or version control system
        # For now, return just current version
        
        version = self.get_skill_version(skill_name)
        return [{
            'version': version,
            'released': datetime.now().isoformat(),
            'changes': ['Initial version']
        }]


# Singleton instance
_manager_instance = None
_instance_lock = None


def get_skill_manager() -> SkillVersionManager:
    """
    Get singleton skill version manager instance
    """
    global _manager_instance

    if _manager_instance is None:
        _manager_instance = SkillVersionManager()

    return _manager_instance


# CLI interface
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Skill Version Manager')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # List command
    list_parser = subparsers.add_parser('list', help='List all skills')
    list_parser.add_argument('--all', action='store_true', help='Include all metadata')

    # Info command
    info_parser = subparsers.add_parser('info', help='Get skill information')
    info_parser.add_argument('skill', help='Skill name')

    # Validate command
    validate_parser = subparsers.add_parser('validate', help='Validate skill manifest')
    validate_parser.add_argument('skill', help='Skill name')

    # Check deprecated command
    check_deprecated_parser = subparsers.add_parser('check', help='Check for deprecated skills')
    check_deprecated_parser.add_argument('--fix', action='store_true', help='Attempt to fix deprecation warnings')

    # Scan command
    scan_parser = subparsers.add_parser('scan', help='Scan for orphaned skills')
    scan_parser.add_argument('--index', action='store_true', help='Build skill index')

    args = parser.parse_args()

    manager = get_skill_manager()

    if args.command == 'list':
        skills = manager.get_all_skills()
        
        print("\n=== ALL SKILLS ===")
        for skill in skills:
            status = "✓" if not skill['deprecated'] else "⚠️"
            version = skill['version']
            tags = ", ".join(skill.get('tag', []))
            print(f"\n{status} {skill['name']} v{version}")
            print(f"    {skill['description']}")
            if tags:
                print(f"    Tags: {tags}")
            if skill['deprecated']:
                print(f"    [DEPRECATED]")
        
        print(f"\nTotal: {len(skills)} skills")

    elif args.command == 'info':
        version = manager.get_skill_version(args.skill)
        name = manager.get_skill_name(args.skill)
        description = manager.get_skill_description(args.skill)
        tags = manager.get_skill_tags(args.skill)
        deprecated = manager.is_deprecated(args.skill)
        dependencies = manager.get_skill_dependencies(args.skill)
        compatibility = manager.get_skill_compatibility(args.skill, version)
        warning = manager.format_version_warning(args.skill, version)
        deprecation_impact = manager.check_deprecation_impact(args.skill)
        
        print(f"\n=== SKILL: {args.skill} ===")
        print(f"Name: {name}")
        print(f"Version: {version}")
        print(f"Description: {description}")
        print(f"Tags: {', '.join(tags)}")
        print(f"Status: {'[DEPRECATED]' if deprecated else '[ACTIVE]'}")
        print(f"Dependencies: {', '.join(dependencies) if dependencies else 'None'}")
        print(f"\nCompatibility:")
        print(f"  Can load: {compatibility['can_load']}")
        if compatibility['dependencies']:
            print(f"  Missing deps: {', '.join(compatibility['dependencies'])}")
        if compatibility['in_conflict']:
            print(f"  Conflicts: {', '.join(compatibility['in_conflict'])}")
        print(f"  Notes: {', '.join(compatibility['notes'])}")
        
        if warning:
            print(f"\n{warning}")
        
        if deprecated:
            print(f"\nDeprecation Impact:")
            print(f"  Dependent skills: {deprecation_impact['dependent_count']}")
            print(f"  Recommendation: {deprecation_impact['recommendation']}")

    elif args.command == 'validate':
        validation = manager.validate_manifest(args.skill)
        
        print(f"\n=== VALIDATION RESULTS: {args.skill.upper()} ===")
        print(f"Valid: {'[YES]' if validation['valid'] else '[NO]'}")
        print(f"Errors: {len(validation['errors'])}")
        
        if validation['errors']:
            for error in validation['errors']:
                print(f"  ✗ {error}")
        
        if validation['warnings']:
            print(f"\nWarnings:")
            for warning in validation['warnings']:
                print(f"  ⚠️  {warning}")

    elif args.command == 'check':
        skills = manager.get_all_skills()
        deprecated_skills = [
            skill['name'] for skill in skills
            if skill['deprecated']
        ]
        
        print("\n=== DEPRECATED SKILLS ===")
        if deprecated_skills:
            print(f"Found {len(deprecated_skills)} deprecated skills:")
            for skill in deprecated_skills:
                version = skill['version']
                dependents = manager.get_skill_dependencies(skill)
                print(f"\n  {skill} v{version}")
                print(f"   Dependents: {len(dependents)} skills")
                
                if args.fix:
                    print(f"   Recommendation: Migrate or provide migration guide")
        
        if not deprecated_skills:
            print("No deprecated skills found.")

    elif args.command == 'scan':
        orphaned = manager.scan_for_orphaned_skills()
        
        print("\n=== SKILL DIRECTORIES ===")
        dirs = [d for d in os.listdir(".opencode/skills") if os.path.isdir(".opencode/skills/" + d)]
        print(f"Total directories: {len(dirs)}")
        if orphaned:
            print(f"\nOrphaned (no SKILL.md): {len(orphaned)}")
            for name in orphaned:
                print(f"  {name}")
            print(f"  Recommendation: Add SKILL.md or remove directory")
        
        if args.index:
            index = manager.get_skill_index()
            
            print(f"\n=== SKILL INDEX ===")
            print(f"Skills: {len(index)}")
            print(f"Tags: {len([k for k in index.keys() if k not in index[k]])}")
            
            print("\nBy Tag:")
            for tag, skill_names in sorted(index.items()):
                if not tag.startswith('_'):
                    print(f"\n{tag}: {', '.join(sorted(skill_names))}")

    else:
        parser.print_help()
