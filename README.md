# SoundDancer

This web application was written using HTML, CSS, and Javascript with the some usage of the OpenGL library. The purpose of this application was to create a personal audio-reactive wallpaper for the Wallpaper Engine program.

![First Demo](/Demo-Gifs/Mr-Blue-Sky.gif)

The wallpaper/web application reacts to any and all audio from the computer, not just music. An increase in amplitude/loudness of the sound translates to an increase in rotations per minute. The program also tries to follow the melody with larger radii indictive or higher pitches. Finally, the script attempts to reverse the direction of the rotation every time it finds a beat and/or a new phrase in the music begins. Please note that when reacting to people speaking in a recording, the reactions are a lot more arbitrary since speech is not as structured as music.

![Second Demo](/Demo-Gifs/Brace-Up-and-Run-Ink.gif)

The application also supports customization with the choice to change the background as well as add an overlay or center image. It also allows for the ability to add more rotating particles as well as change the lengths and colors of the trails.

![Third Demo](/Demo-Gifs/Heritors-of-Arcadia.gif)

Another important aspect of the application as a wallpaper is that it supports blank colors as well. It does not rely on the placement of elements to hide anything. When the sound is gone, the trails will stop animating and hide themselves by causing the canvas to disappear.

![Selector Demo](/Demo-Gifs/Selector-Demo.gif)

Please note that the usage of Wallpaper Engine is absolutely necessary in order for the scripts to work. All customizability is built with the Wallpaper Engine's base user inteface in mind. Additionally, the customization and audio listeners are prebuilt from the engine. The trails have been programmed to hide themselves until there is audio.

[Another Reminder that the Wallpaper Engine is required for the usage of this wallpaper](https://www.wallpaperengine.io/)
