@echo off
echo Cleaning up repository...

git rm -r --cached frontend/node_modules 2>nul
git rm -r --cached node-backend/node_modules 2>nul
git rm -r --cached *.csv *.xlsx *.pkl *.h5 2>nul
git rm -r --cached uploads/ media/ temp/ 2>nul
git rm -r --cached __pycache__/ venv/ env/ 2>nul

git add .gitignore
git commit -m "Remove large files and add .gitignore"

git gc --aggressive --prune=now
git config --global http.postBuffer 524288000

echo Pushing to remote...
git push -u origin main --force

echo Done!
pause