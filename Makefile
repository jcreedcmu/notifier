.PHONY: build install

build:
	npx esbuild src/app.js --bundle --outfile=public/app.bundle.js
	npx cap sync
	cd android && ./gradlew assembleDebug

install: build
	adb install -r android/app/build/outputs/apk/debug/app-debug.apk
