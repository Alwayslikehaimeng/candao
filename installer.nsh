!macro customInstall
  ; 如果用户改了盘符但没保留 CanDao 文件夹，自动补上
  ${If} $INSTDIR !~ ".*\\CanDao$"
  ${AndIf} $INSTDIR !~ ".*\\CanDao\\$"
    StrCpy $INSTDIR "$INSTDIR\CanDao"
  ${EndIf}
!macroend
