# Spoon

Enhance your Matrix with groups, tabs and more!

![Icon](resources/img/banner.png)

Use Spoon to group Matrix blocks, hide blocks and / or fields, and organise your block layouts with tabs.

Spoon never touches your content, it is simply a layer on top of the core Matrix field type, so if you ever don’t want it you can just take the blue pill and uninstall it.

Or is the red pill. Which is the real illusion?!

---

**Beware this is beta-ware!**

Currently your groups and tabs are limited to the global context, but in the future I will bring in support for Entry Types, Category Groups and more like in the good old days.

See the [roadmap](#roadmap) for progress.

**Pricing:** this plugin will be paid for when it is released onto the plugin store, how much is as yet undecided. 

## Requirements

This plugin requires Craft CMS 3.0.x or later.

## Installation

To install the plugin, follow these instructions.

1. Open your terminal and go to your Craft project:

        cd /path/to/project

2. Then tell Composer to load the plugin:

        composer require angellco/spoon

3. In the Control Panel, go to Settings → Plugins and click the “Install” button for Spoon.

## Overview

Organise long lists of blocks into smaller groups for clearer selection.

![block type groups example](resources/img/docs/groups-ui.png)

Arrange fields into tabbed groups on each block type.

![block type field layouts example](resources/img/docs/flds-ui.png)

Use just one Matrix field and hide and show blocks or fields based on the Entry Type, Category Group and more.

![group block types button](resources/img/docs/group-block-types.jpg)


## Usage

The way Spoon works is by allowing you to create your block type groups and field layouts in multiple contexts.

Say you have a large Matrix field that drives a lot of the content on your site, you want it to work the same way across most of the control panel but there are often a couple of places you just want to tweak it. You might want an extra block type for a specific section, or to not show certain fields somewhere as they aren’t applicable in that context.

We enable this to happen by making use of contexts. Each time the code runs that manipulates the output of your Matrix fields we check the context of the page to see if there is any specific configuration for that context and if not fall back to any defaults you may have set.

The following contexts are currently supported:

* Entry Types
* Category Groups
* Global Sets
* Users

You can override your defaults for a specific context by going to the field layout designer for each one, clicking the gear icon of any active Matrix field and selecting “Group block types”:

![group block types button](resources/img/docs/group-block-types.jpg)

## Setting up defaults

To create default block type groups and field layouts for all your Matrix fields go to Settings → Spoon. Here you will find a list of your current Matrix fields.

Click a field name to launch the block type groups editor. It should look something like this:

![block type groups editor](resources/img/docs/block-type-groups-editor.jpg)

Now you can group your block types in the same way that you create a field layout for a section:

![block type groups editor filled in](resources/img/docs/block-type-groups-editor-2.jpg)

If you leave any block types off then they won’t be shown.

Once you have some groups you can go one step further and customize the field layout for a particular block - just click the gear icon and select ‘Edit field layout’.

![block type field layout](resources/img/docs/block-type-field-layout-editor.jpg)

Thats it! You should now be able to browse to somewhere that uses that field and see your new groups and field layouts in action.


## Roadmap

* ~~Support the other contexts PMM did~~
* ~~Also support plugin hooks~~ - removed support
* ~~Deal with Sites / Locales etc~~
* ~~Write the C2 > C3 migration~~
* ~~Documentation~~
* Release 3.0.0
* Convert JS to use the new Garnish global events, if possible
* Support columns on flds
* Vertical tab layout
* Permissions! Per block type grouping

---

Brought to you by [Angell & Co](https://angell.io)

This project used to live under a [different name](https://github.com/angell-co/Pimp-My-Matrix) in Craft 2, but I renamed it for obvious reasons.

Big thanks to the lovely people at [Supercool](https://github.com/supercool) for letting me take this project over.
