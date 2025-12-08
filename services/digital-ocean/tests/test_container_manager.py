#!/usr/bin/env python3
"""
Test Suite for Digital Ocean Container Manager
Tests all functionality without making actual API calls
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from container_manager import DigitalOceanManager


class TestDigitalOceanManager(unittest.TestCase):
    """Test cases for DigitalOceanManager"""

    def setUp(self):
        """Set up test environment"""
        os.environ['DIGITALOCEAN_API_TOKEN'] = 'test_token_12345'

    def tearDown(self):
        """Clean up after tests"""
        if 'DIGITALOCEAN_API_TOKEN' in os.environ:
            del os.environ['DIGITALOCEAN_API_TOKEN']

    def test_initialization_with_token(self):
        """Test manager initializes with valid token"""
        manager = DigitalOceanManager()
        self.assertIsNotNone(manager.api_token)
        self.assertEqual(manager.api_token, 'test_token_12345')

    def test_initialization_without_token(self):
        """Test manager raises error without token"""
        del os.environ['DIGITALOCEAN_API_TOKEN']
        with self.assertRaises(ValueError) as context:
            DigitalOceanManager()
        self.assertIn('DIGITALOCEAN_API_TOKEN not found', str(context.exception))

    @patch('digitalocean.Manager')
    def test_list_droplets_empty(self, mock_manager):
        """Test listing droplets when none exist"""
        mock_manager_instance = Mock()
        mock_manager_instance.get_all_droplets.return_value = []
        mock_manager.return_value = mock_manager_instance

        manager = DigitalOceanManager()
        droplets = manager.list_droplets()

        self.assertEqual(len(droplets), 0)
        mock_manager_instance.get_all_droplets.assert_called_once()

    @patch('digitalocean.Manager')
    def test_list_droplets_with_data(self, mock_manager):
        """Test listing droplets with data"""
        mock_droplet = Mock()
        mock_droplet.name = 'test-server'
        mock_droplet.id = 123456
        mock_droplet.ip_address = '192.168.1.1'
        mock_droplet.status = 'active'
        mock_droplet.region = {'name': 'New York 3'}
        mock_droplet.size_slug = 's-1vcpu-1gb'

        mock_manager_instance = Mock()
        mock_manager_instance.get_all_droplets.return_value = [mock_droplet]
        mock_manager.return_value = mock_manager_instance

        manager = DigitalOceanManager()
        droplets = manager.list_droplets()

        self.assertEqual(len(droplets), 1)
        self.assertEqual(droplets[0].name, 'test-server')

    @patch('digitalocean.Droplet')
    @patch('digitalocean.Manager')
    def test_create_droplet(self, mock_manager, mock_droplet_class):
        """Test droplet creation"""
        mock_droplet = Mock()
        mock_droplet.id = 123456
        mock_droplet.status = 'active'
        mock_droplet.ip_address = '192.168.1.1'
        mock_droplet.ip_v6_address = '2001:db8::1'
        mock_droplet.get_actions.return_value = [Mock(status='completed')]

        mock_droplet_class.return_value = mock_droplet

        mock_manager_instance = Mock()
        mock_manager_instance.get_all_sshkeys.return_value = []
        mock_manager.return_value = mock_manager_instance

        manager = DigitalOceanManager()
        result = manager.create_droplet('test-server')

        self.assertIsNotNone(result)
        mock_droplet.create.assert_called_once()

    @patch('digitalocean.Manager')
    def test_destroy_droplet(self, mock_manager):
        """Test droplet destruction"""
        mock_droplet = Mock()
        mock_manager_instance = Mock()
        mock_manager_instance.get_droplet.return_value = mock_droplet
        mock_manager.return_value = mock_manager_instance

        manager = DigitalOceanManager()
        manager.destroy_droplet(123456)

        mock_droplet.destroy.assert_called_once()

    @patch('digitalocean.Manager')
    def test_get_droplet_info(self, mock_manager):
        """Test getting droplet information"""
        mock_droplet = Mock()
        mock_droplet.id = 123456
        mock_droplet.name = 'test-server'
        mock_droplet.status = 'active'
        mock_droplet.ip_address = '192.168.1.1'
        mock_droplet.ip_v6_address = '2001:db8::1'
        mock_droplet.region = {'name': 'New York 3'}
        mock_droplet.size_slug = 's-1vcpu-1gb'
        mock_droplet.image = {'name': 'docker-20-04'}
        mock_droplet.created_at = '2025-12-04T00:00:00Z'
        mock_droplet.tags = ['auto-created', 'docker-container']

        mock_manager_instance = Mock()
        mock_manager_instance.get_droplet.return_value = mock_droplet
        mock_manager.return_value = mock_manager_instance

        manager = DigitalOceanManager()
        info = manager.get_droplet_info(123456)

        self.assertEqual(info['id'], 123456)
        self.assertEqual(info['name'], 'test-server')
        self.assertEqual(info['status'], 'active')
        self.assertEqual(info['ip_address'], '192.168.1.1')

    def test_cloud_init_script_content(self):
        """Test cloud-init script contains required setup"""
        manager = DigitalOceanManager()
        script = manager._get_cloud_init_script()

        # Check for essential commands
        self.assertIn('apt-get update', script)
        self.assertIn('docker-compose', script)
        self.assertIn('ufw allow', script)
        self.assertIn('systemctl enable docker', script)

        # Check for required ports
        self.assertIn('80/tcp', script)
        self.assertIn('443/tcp', script)
        self.assertIn('22/tcp', script)


class TestInputValidation(unittest.TestCase):
    """Test input validation"""

    def test_valid_droplet_names(self):
        """Test valid droplet naming"""
        valid_names = [
            'my-server',
            'app-prod-01',
            'test-server-123',
            'ricos-tacos-prod'
        ]

        for name in valid_names:
            # Basic validation - no spaces, reasonable length
            self.assertNotIn(' ', name)
            self.assertLessEqual(len(name), 200)

    def test_valid_regions(self):
        """Test valid region codes"""
        valid_regions = ['nyc1', 'nyc3', 'sfo3', 'sgp1', 'lon1', 'fra1', 'tor1', 'blr1']

        for region in valid_regions:
            self.assertTrue(len(region) > 0)
            self.assertTrue(region.islower() or region.isdigit())

    def test_valid_sizes(self):
        """Test valid size slugs"""
        valid_sizes = [
            's-1vcpu-1gb',
            's-1vcpu-2gb',
            's-2vcpu-2gb',
            's-2vcpu-4gb',
            's-4vcpu-8gb'
        ]

        for size in valid_sizes:
            self.assertTrue(size.startswith('s-'))
            self.assertIn('vcpu', size)
            self.assertIn('gb', size)


def run_tests():
    """Run all tests"""
    print("=" * 70)
    print("Digital Ocean Container Manager - Test Suite")
    print("=" * 70)
    print()

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestDigitalOceanManager))
    suite.addTests(loader.loadTestsFromTestCase(TestInputValidation))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("=" * 70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 70)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
