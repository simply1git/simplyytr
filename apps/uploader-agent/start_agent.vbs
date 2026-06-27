Set WshShell = CreateObject("WScript.Shell")
' Run the npm start command silently (0 means hidden window)
WshShell.Run "cmd /c cd ""%~dp0"" && npm start > agent.log 2>&1", 0
Set WshShell = Nothing
