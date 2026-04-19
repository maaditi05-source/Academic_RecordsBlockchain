#!/usr/bin/env python3
"""
Convert all per-node docker-compose files to use network_mode: host.
This eliminates Docker bridge subnet conflicts with the campus 172.20.x.x network.
"""
import re
import os

DOCKER_DIR = '/home/aditi/workspace/Academic_RecordsBlockchain/docker'

ACTIVE_FILES = [
    'docker-compose-orderer1.yaml',
    'docker-compose-orderer2.yaml',
    'docker-compose-orderer3.yaml',
    'docker-compose-nitwarangal-peer0.yaml',
    'docker-compose-nitwarangal-peer1.yaml',
    'docker-compose-nitwarangal-peer2.yaml',
    'docker-compose-depts-cse.yaml',
    'docker-compose-depts-cse-faculty.yaml',
    'docker-compose-depts-ece.yaml',
    'docker-compose-depts-ece-faculty.yaml',
    'docker-compose-verifiers-peer0.yaml',
    'docker-compose-verifiers-peer1.yaml',
]

def convert_to_host_networking(content):
    """Convert a docker-compose file to use host networking."""
    
    # Remove version line
    content = re.sub(r"^version: '3\.7'\n\n?", '', content)
    
    # Remove top-level networks block (with or without ipam/subnet)
    content = re.sub(
        r'\nnetworks:\n  fabric_net:\n    driver: bridge\n'
        r'(    ipam:\n      config:\n        - subnet: [^\n]+\n)?',
        '\n', content
    )
    
    # Remove top-level volumes block entirely — we'll add back only needed ones
    # Actually, keep volumes but just remove network-related ones
    
    # Remove per-service 'networks:' blocks
    content = re.sub(r'\n    networks:\n      - fabric_net\n', '\n', content)
    
    # Remove per-service 'ports:' blocks (one or more port mappings)
    content = re.sub(r'\n    ports:\n(      - "[^"]*"\n)+', '\n', content)
    content = re.sub(r'\n    ports:\n(      - \$\{[^}]*\}[^\n]*\n)+', '\n', content)
    
    # Remove per-service 'extra_hosts:' blocks
    content = re.sub(r'\n    extra_hosts:\n(      - "[^"]*"\n)+', '\n', content)
    
    # Add network_mode: host after every 'container_name:' line
    content = re.sub(
        r'(    container_name: [^\n]+)',
        r'\1\n    network_mode: host',
        content
    )
    
    # Change CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE from fabric_net to host
    content = content.replace(
        'CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_net',
        'CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=host'
    )
    
    # Change CouchDB addresses from container_name:5984 to localhost:5984
    # These are in COUCHDBCONFIG_COUCHDBADDRESS env vars
    content = re.sub(
        r'(COUCHDBADDRESS=)[a-zA-Z0-9._]+:(\d+)',
        r'\1localhost:\2',
        content
    )
    
    return content

for fname in ACTIVE_FILES:
    fpath = os.path.join(DOCKER_DIR, fname)
    if not os.path.exists(fpath):
        print(f"⚠️  Skipping {fname} (not found)")
        continue
    
    with open(fpath) as f:
        original = f.read()
    
    modified = convert_to_host_networking(original)
    
    with open(fpath, 'w') as f:
        f.write(modified)
    
    print(f"✅ Converted {fname} to host networking")

print("\n🎉 All compose files converted to network_mode: host!")
print("Docker bridge networking is now completely bypassed.")
