Change Log
==========

Sorry for the sparse after 0.11, it have been wild years...

Hard Glitch v1.0.3 - 2023-01-01
--------------------------------

Added a "give feedback" button so that players find the feedback form easilly.


Hard Glitch v1.0.2 - 2022-01-01
--------------------------------

Quick bugfix.


Hard Glitch v1.0.0 - 2021-12-27
--------------------------------

First "complete" release.


Hard Glitch v0.11.1 - 2021-02-05
--------------------------------

This version fixes most bugs and balance issues.

These are the changes that can be seen when playing:

- Final sprite for "Aggressive Life Form".
- Level 1 content generation is fixed and improved, better placement, removed difficult items and entities, etc.
- "Delete" action damages are reduced to 4.
- Made extremely rare the probability to be blocked in Level 1 at the exit of the first room.
- The text "Find The Exit" will not prevent anymore the player from playing while it is displayed.
- Tweaked UI in-game and in title screen to help with visibility.
- Improved "procgen warning" screen text.
- Fixed random crashes (when animations were played outside the field-of-view of the player).
- Fixed sprite visibility glitch when "Jump" or "Swap" is used outside the field-of-view of the player.

Hard Glitch v0.11 - 2021-01-24
------------------------------

These are the changes that can be seen when playing:

- Level 1 is complete (procedural generation & whole content) - the 3 other levels will be released in a later version.
- Completed all NPCs AI/behavior (Virus, Anti-Virus, Microcode, Program, Aggressive Life Form).
- Added an aggressive kind of Life Form (sprite is temporary)
- Added transparent versions of block elements (movable walls) - you can see through them but they still block movement, and you can push/pull them.
- Level 1 exit area now uses transparent blocks instead of opaque ones, to let the player see the exit.
- Added a screen clarifying that the levels are procedurally generated.
- Characters drop their items when destroyed, letting the player steal their powers.
- Damage and healing values are now visible through an animated number.
- Bouncing on something (after being pushed or pulled) will do some damage.
- Reduced size of Level 1.
- Reduced "Delete" range and changed it's range shape.
- Info text will now show the most important thing first.
- Deactivated parallel turn animations to avoid some "physics" issues.
- Level 1: modified exit area to allow "Jump" to reach the exit.
- Level 1: items found in crypto-files are far better and more varied.
- Unsafe basic actions are now visible by default, player can do them by clicking, but not through the keyboard.
- Life Forms don't push items and each-other around anymore.
- Corruption now only updates at multiple of 8 computer cycle.
- Various NPCs stats tweaks.

- Removed most description of the ground tiles to have less text as noise.
- Improved Camera movements (though still unperfect)
- Improved text descriptions of items, actions, effects and characters.
- Tweaked speed of movement animations.
- Removed the random test level.
- Improved animations of many characters (thanks Ash).
- No music in test levels (console `debug_tools_enabled = true` to enable them).
- Improved starting rooms design.
- Improved editor buttons order (console `debug_tools_enabled = true` then F2 in-game to open the editor).
- Deactivated sound on "Wait" action (even for player).
- Tweaked order of buttons in in-game menu.

- Fixed numerous crashes.
- Fixed: no "Delete" animation when targetting yourself.

Hard Glitch v0.10 - 2020-10-25
------------------------------

These are the changes that can be seen when playing:

- "Game Over" screen improved (still WIP).
- Added mouse cursors.
- Improved speed of movement: "Move" animations are now faster and plays almost simultaneously if there are a lot of characters.
- Improved general program speed by removing debugging tools.
- Crypto Keys can now be moved, but destroying the ones in the first rooms leads to "Game Over".
- Level 1 "push/pull" first room improvements.
- "Copy" action now maintain the kind of AI or player control of the copied entity (only usable in the "Random Test Level" for now).
- Added "Merge" action (only usable in the "Random Test Level" for now).
- Improved "Credits" screen.

- Fixed "random jump" from teleporting inside walls.
- Fixed wrong walls appearing in level 1.
- Fixed (wip) level 1 music looping issue.
- Added compression on sound effects channel to limit them from being loud.
- Fixed accidental item dropping animation (not the right animation).
- Fixed infobox button sprite.
- Fixed view distance of characters being +1 for no reason.


Hard Glitch v0.9 - 2020-10-11
-----------------------------

First release - Demo version
Only allow playing the level 1.