!macro customInstall
  ; 确保安装路径以 CanDao 结尾
  Push $0
  StrCpy $0 $INSTDIR "" -7
  StrCmp $0 "\CanDao" done
  StrCpy $INSTDIR "$INSTDIR\CanDao"
  done:
  Pop $0
!macroend
