
# Requires butler in addition to Python and Klaim's identity, you'll need to tweak it if you want to publish it somewhere else.

import re

project_name = "hardglitch"
publisher = "klaim"

to_publish = [
    "audio/",
    "fonts/",
    "images/",
    "js/",
    "index.html",
    "favicon.ico",
    "changelog.md",
]

version_file = "js/version.js"

def read_version_from_js(js_file_path):
    # We expect the js file to have something like "blahblah_VERSION = "v2.3.4" and we will only extract what's between the quotes.
    def read_version_file():
        with open(version_file, 'r') as file:
            return file.read().replace('\n', '')
    all_data = read_version_file()
    matches = re.search(".*_VERSION\s*=\s*\"([\wv.-]+)\".*", all_data)
    return matches.group(1)

version_name = read_version_from_js(version_file)
    
print("version:", version_name)

archive_file_name = "{}-{}.zip".format(project_name, version_name)
print("archive file:", archive_file_name)

# Now we archive the specified files and directories
import os.path
import zipfile

with zipfile.ZipFile(archive_file_name, mode="w") as archive:
    import pathlib
    def add_to_zip(file_or_dir):
        if os.path.isdir(file_or_dir):
            for item in pathlib.Path(file_or_dir).iterdir():
                add_to_zip(str(item))
        else:
            print("archiving:", file_or_dir)
            archive.write(file_or_dir)

    for file_or_dir in to_publish:
        add_to_zip(file_or_dir)

# Now we need to publish that archive
import subprocess
publishing_channel = "web"
publishing_target = "{}/{}:{}".format(publisher, project_name, publishing_channel)
publish_command = [ "butler", "push", archive_file_name, publishing_target, "--userversion", version_name ]

print("publishing command:", ' '.join(str(x) for x in publish_command))
subprocess.call(publish_command)

status_command = [ "butler", "status", publishing_target ]
print("status command:", ' '.join(str(x) for x in status_command))
subprocess.call(status_command)

print("all done!")