/**
 * Spoon plugin for Craft CMS
 *
 * @copyright Copyright (c) 2018, 2022 Double Secret Agency
 * @link      https://plugins.doublesecretagency.com/
 * @package   Spoon
 * @since     3.0.0
 */
(function($){


    if (typeof Spoon == 'undefined')
    {
        Spoon = {};
    }

    /**
     * Overrides the default Matrix ‘add block’ buttons with our grouped ones
     * and keeps them up to date based on the current context.
     *
     * Also adds any field layouts that may exist for each block type
     * in the current context.
     */
    Spoon.FieldManipulator = Garnish.Base.extend(
        {

            _handleMatrixInputInitProxy: null,
            _handleMatrixInputBlockAddedProxy: null,

            init: function(settings)
            {
                // Set up
                this.setSettings(settings, Spoon.FieldManipulator.defaults);

                // Work out if we’re in the 'entrytype' context so we can keep things up to date
                if (this.settings.context.split(':')[0] === 'entrytype')
                {
                    // Listen to entry type switch
                    Garnish.on(Craft.EntryTypeSwitcher, 'beforeTypeChange', $.proxy(function(ev)
                    {
                        this.settings.context = 'entrytype:' + ev.target.$typeSelect.val();
                    }, this));
                }

                this._handleMatrixInputInitProxy = $.proxy(this, 'handleMatrixInputInit');
                this._handleMatrixInputBlockAddedProxy = $.proxy(this, 'handleMatrixInputBlockAdded');

                Garnish.on(Craft.MatrixInput, 'afterInit', this._handleMatrixInputInitProxy);
                Garnish.on(Craft.MatrixInput, 'blockAdded', this._handleMatrixInputBlockAddedProxy);

                if (typeof Craft.SuperTable !== "undefined") {
                    if (typeof Craft.SuperTable.Input !== "undefined") {
                        Garnish.on(Craft.SuperTable.Input, 'afterInit', this._handleMatrixInputInitProxy);
                        Garnish.on(Craft.SuperTable.Input, 'blockAdded', this._handleMatrixInputBlockAddedProxy);
                    } else if (typeof Craft.SuperTable.MatrixInputAlt !== "undefined") {
                        Garnish.on(Craft.SuperTable.MatrixInputAlt, 'afterInit', this._handleMatrixInputInitProxy);
                        Garnish.on(Craft.SuperTable.MatrixInputAlt, 'blockAdded', this._handleMatrixInputBlockAddedProxy);
                    }
                }

                // If we are versioned we need to scrape the page as no events will fire
                if (this.settings.versioned) {
                    Garnish.$doc.find('.matrix-field').each($.proxy(function(idx, matrixField)
                    {
                        var $matrixField = $(matrixField);

                        // sort out the button groups
                        this.initBlockTypeGroups($matrixField);

                        // initialize the blocks
                        $matrixField.find('> .blocks > .matrixblock').each($.proxy(function(idx, matrixBlock)
                        {
                            this.initBlocks($(matrixBlock), $matrixField);
                        }, this));

                    }, this));
                }
            },


            handleMatrixInputInit: function(ev)
            {
                var $matrixField = ev.target.$container,
                    $blocks = ev.target.$blockContainer.children();

                this.initBlockTypeGroups($matrixField);

                $blocks.each($.proxy(function(key,block)
                {
                    this.initBlocks($(block), $matrixField);
                }, this));
            },

            handleMatrixInputBlockAdded: function(ev)
            {
                var $matrixField = ev.target.$container,
                    $block = $(ev.$block);

                this.initBlocks($block, $matrixField);
            },

            initBlockTypeGroups: function($matrixField)
            {

                // check if we’ve already spooned this field
                if ( !$matrixField.data('spooned') )
                {

                    // get matrix field handle out of the dom
                    var matrixFieldHandle = this._getMatrixFieldName($matrixField);

                    // Filter by the current matrix field
                    var spoonedBlockTypes = [];

                    // Check current context first
                    if (typeof this.settings.blockTypes[this.settings.context] !== "undefined")
                    {
                        spoonedBlockTypes = $.grep(this.settings.blockTypes[this.settings.context], function(e){ return e.fieldHandle === matrixFieldHandle; });
                    }

                    // Check global context
                    if (spoonedBlockTypes.length < 1 && typeof this.settings.blockTypes['global'] !== "undefined")
                    {
                        spoonedBlockTypes = $.grep(this.settings.blockTypes['global'], function(e){ return e.fieldHandle === matrixFieldHandle; });
                    }

                    // Check we have some config
                    if ( spoonedBlockTypes.length >= 1 )
                    {

                        // add some data to tell us we’re spooned
                        $matrixField.data('spooned', true);

                        // store the data for when we loop the blocks themselves so we don’t have to run all this again
                        $matrixField.data('spoon-block-types', spoonedBlockTypes);

                        // Only do the buttons if we’re not versioned
                        if (!this.settings.versioned) {

                            // find the original buttons
                            var $origButtons = $matrixField.find('> .buttons').first();

                            // hide the original ones and start the button spooning process
                            $origButtons.addClass('hidden');

                            // make our own container, not using .buttons as it gets event bindings
                            // from MatrixInput.js that we really don't want
                            var $spoonedButtonsContainer = $('<div class="buttons-spooned" />').insertAfter($origButtons);

                            // the main button group
                            var $mainButtons = $('<div class="btngroup" />').appendTo($spoonedButtonsContainer);

                            // the secondary one, used when the container gets too small
                            var $secondaryButtons = $('<div class="btn add icon menubtn hidden">' + Craft.t('app', 'Add a block') + '</div>').appendTo($spoonedButtonsContainer),
                                $secondaryMenu = $('<div class="menu spoon-secondary-menu" />').appendTo($spoonedButtonsContainer);

                            // loop each block type config
                            for (var i = 0; i < spoonedBlockTypes.length; i++) {

                                // check if group exists, add if not
                                if ($mainButtons.find('[data-spooned-group="' + spoonedBlockTypes[i].groupName + '"]').length === 0) {
                                    // main buttons
                                    var $mainMenuBtn = $('<div class="btn  menubtn">' + Craft.t('site', spoonedBlockTypes[i]['groupName']) + '</div>').appendTo($mainButtons),
                                        $mainMenu = $('<div class="menu" data-spooned-group="' + spoonedBlockTypes[i]['groupName'] + '" />').appendTo($mainButtons),
                                        $mainUl = $('<ul />').appendTo($mainMenu);

                                    // single group buttons
                                    if (i !== 0) {
                                        $('<hr>').appendTo($secondaryMenu);
                                    }
                                    $('<h6>' + Craft.t('site', spoonedBlockTypes[i]['groupName']) + '</h6>').appendTo($secondaryMenu);
                                    var $secondaryUl = $('<ul/>').appendTo($secondaryMenu);
                                }

                                // make a link
                                $li = $('<li><a data-type="' + spoonedBlockTypes[i].matrixBlockType.handle + '">' + Craft.t('site', spoonedBlockTypes[i].matrixBlockType.name) + '</a></li>');

                                // add it to the main list
                                $li.appendTo($mainUl);

                                // add a copy to the secondary one as well
                                $li.clone().appendTo($secondaryUl);

                            }

                            // make the MenuBtns work
                            $mainButtons.find('.menubtn').each(function() {

                                new Garnish.MenuBtn($(this),
                                    {
                                        onOptionSelect: function(option) {
                                            // find our type and click the correct original btn!
                                            var type = $(option).data('type');
                                            $origButtons.find('[data-type="' + type + '"]').trigger('click');
                                        }
                                    });

                            });

                            new Garnish.MenuBtn($secondaryButtons,
                                {
                                    onOptionSelect: function(option) {
                                        // find our type and click the correct original btn!
                                        var type = $(option).data('type');
                                        $origButtons.find('[data-type="' + type + '"]').trigger('click');
                                    }
                                });

                            // Bind a resize to the $matrixField so we can work out which groups UI to show
                            this.addListener($matrixField, 'resize', $.proxy(function() {
                                // Do we know what the button group width is yet?
                                if (!$matrixField.data('spoon-main-buttons-width')) {
                                    $matrixField.data('spoon-main-buttons-width', $mainButtons.width());

                                    if (!$matrixField.data('spoon-main-buttons-width')) {
                                        return;
                                    }
                                }

                                // Check the widths and do the hide/show
                                var fieldWidth = $matrixField.width(),
                                    mainButtonsWidth = $matrixField.data('spoon-main-buttons-width');
                                if (fieldWidth < mainButtonsWidth) {
                                    $secondaryButtons.removeClass('hidden');
                                    $mainButtons.addClass('hidden');
                                } else {
                                    $secondaryButtons.addClass('hidden');
                                    $mainButtons.removeClass('hidden');
                                }

                            }, this));
                        }

                    }

                }

            },

            initBlocks: function($matrixBlock, $matrixField)
            {

                if ( !$matrixBlock.data('spooned') )
                {

                    // Set this so we don’t re-run this
                    $matrixBlock.data('spooned', true);

                    // Get the cached spooned block types data for this whole field
                    var spoonedBlockTypes = $matrixField.data('spoon-block-types');

                    // Check we have some config
                    if ( typeof spoonedBlockTypes !== "undefined" && spoonedBlockTypes.length >= 1 )
                    {

                        // First, sort out the settings menu
                        if (!this.settings.versioned) {
                            var $settingsBtn = $matrixBlock.find('.actions .settings.menubtn');
                            this.initSettingsMenu($settingsBtn, spoonedBlockTypes, $matrixField);
                        }

                        // Second, get the current block’s type out of the dom so we can do the field layout
                        var matrixBlockTypeHandle = this._getMatrixBlockTypeHandle($matrixBlock);

                        // Further filter our spoonedBlockTypes array by the current block’s type
                        var spoonedBlockType = $.grep(spoonedBlockTypes, function(e){ return e.matrixBlockType.handle === matrixBlockTypeHandle; });

                        // Initialize the field layout on the block
                        if ( spoonedBlockType.length === 1 && spoonedBlockType[0].fieldLayoutId !== null )
                        {
                            $matrixBlock.data('spooned-block-type', spoonedBlockType[0]);
                            this.initBlockFieldLayout($matrixBlock, $matrixField);
                        }
                        // If that failed, do another check against the global context
                        else if (this.settings.blockTypes.hasOwnProperty('global'))
                        {
                            var matrixFieldHandle = this._getMatrixFieldName($matrixField);
                            spoonedBlockTypes = $.grep(this.settings.blockTypes['global'], function(e){ return e.fieldHandle === matrixFieldHandle; });

                            if ( spoonedBlockTypes.length >= 1 )
                            {
                                spoonedBlockType = $.grep(spoonedBlockTypes, function(e){ return e.matrixBlockType.handle === matrixBlockTypeHandle; });

                                if ( spoonedBlockType.length === 1 && spoonedBlockType[0].fieldLayoutId !== null )
                                {
                                    $matrixBlock.data('spooned-block-type', spoonedBlockType[0]);
                                    this.initBlockFieldLayout($matrixBlock, $matrixField);
                                }
                                else
                                {
                                    $matrixBlock.addClass('matrixblock-not-spooned');
                                }
                            }
                            else
                            {
                                $matrixBlock.addClass('matrixblock-not-spooned');
                            }
                        }
                        else
                        {
                            $matrixBlock.addClass('matrixblock-not-spooned');
                        }

                    }
                    else
                    {
                        $matrixBlock.addClass('matrixblock-not-spooned');
                    }

                }
                else
                {
                    // Fixes Redactor
                    Garnish.$doc.trigger('scroll');
                }

            },

            initBlockFieldLayout: function($matrixBlock, $matrixField)
            {

                var spoonedBlockType = $matrixBlock.data('spooned-block-type'),
                    tabs = spoonedBlockType.fieldLayoutModel.tabs,
                    fields = spoonedBlockType.fieldLayoutModel.fields;

                // Check we have some tabs
                // TODO: would be nice to not show the tab nav if there is only one tab
                if ( tabs.length >= 1 )
                {
                    // Add a class so we can style
                    $matrixBlock.addClass('matrixblock-spooned');

                    if (this.settings.versioned) {
                        $matrixBlock.addClass('matrixblock-spooned--disabled');
                    }

                    // Get a namespaced id
                    var namespace = $matrixField.prop('id') + '-blocks-' + $matrixBlock.data('id'),
                        spoonedNamespace = 'spoon-' + namespace;

                    // Add the tabs container
                    var $tabs = $('<ul class="spoon-tabs"/>').appendTo($matrixBlock);

                    // Make our own fields container and hide the native one, but keep its height
                    var $spoonedFields = $('<div class="spoon-fields"/>').css({ 'opacity' : 0 }).appendTo($matrixBlock),
                        $fields = $matrixBlock.find('> .fields');
                    $fields.css({ 'opacity' : 0 });
                    $spoonedFields.addClass('fields');

                    // Loop the tabs
                    for (var i = 0; i < tabs.length; i++)
                    {

                        // Set up the first one to be active
                        var navClasses = '',
                            paneClasses = '';

                        if (i===0)
                        {
                            navClasses = ' sel';
                        }
                        else
                        {
                            paneClasses = ' hidden';
                        }

                        // Add the tab nav, if there is more than one
                        if (tabs.length > 1)
                        {
                            var $tabLi = $('<li/>').appendTo($tabs),
                                $tabA = $('<a id="'+spoonedNamespace+'-'+i+'" class="tab'+navClasses+'">'+Craft.t('site', tabs[i].name)+'</a>')
                                    .appendTo($tabLi)
                                    .data('spooned-tab-target', '#'+spoonedNamespace+'-pane-'+i);
                        }

                        // Make a tab pane
                        var $pane = $('<div id="'+spoonedNamespace+'-pane-'+i+'" class="'+paneClasses+'"/>').appendTo($spoonedFields);

                        // Filter the fields array by their associated tabId and loop over them
                        var tabFields = $.grep(fields, function(e){ return e.tabId === tabs[i].id; });
                        for (var n = 0; n < tabFields.length; n++)
                        {
                            // Move the required field to our new container
                            $fields.find('#' + namespace + '-fields-' + tabFields[n].handle + '-field').appendTo($pane);
                        }

                        // Now check for errors and update the tab if needed
                        if ($pane.find('.field.has-errors').length > 0 && tabs.length > 1) {
                            $tabA.addClass('error');
                            $tabA.append(' <span data-icon="alert" />');
                        }

                    }

                    // Bind events to tab nav clicks
                    if (tabs.length > 1)
                    {
                        this.addListener($tabs.find('a'), 'click', 'onTabClick');
                    }

                    // Force the fields to be removed from the layout
                    $fields.hide();

                    $spoonedFields.velocity({opacity: 1}, 'fast', $.proxy(function()
                    {
                        // Re-initialize the Craft UI
                        Craft.initUiElements($spoonedFields);
                    }, this));

                }

            },

            onTabClick: function(ev)
            {

                ev.preventDefault();
                ev.stopPropagation();

                var $tab = $(ev.target),
                    $tabNav = $tab.parent().parent('.spoon-tabs'),
                    targetSelector = $tab.data('spooned-tab-target'),
                    $target = $(targetSelector);

                // Toggle tab nav state
                $tabNav.find('a.sel').removeClass('sel');
                $tab.addClass('sel');

                // Toggle the pane state
                $target.siblings('div').addClass('hidden');
                $target.removeClass('hidden');

            },

            initSettingsMenu: function($settingsBtn, spoonedBlockTypes, $matrixField)
            {
                Garnish.requestAnimationFrame($.proxy(function()
                {
                    // Get the Garnish.MenuBtn object
                    var menuBtn = $settingsBtn.data('menubtn') || false;

                    // If there wasn’t one then fail and try again
                    if (!menuBtn)
                    {
                        this.initSettingsMenu($settingsBtn, spoonedBlockTypes, $matrixField);
                        return;
                    }

                    // Get the field handle
                    var matrixFieldHandle = this._getMatrixFieldName($matrixField);

                    // Get the actual menu out of it once we get this far
                    var $menu = menuBtn.menu.$container;
                    $menu.addClass('spoon-settings-menu');

                    // Hide all the li’s with add block links in them
                    $menu.find('a[data-action="add"]').parents('li').addClass('hidden');

                    // Remove all the padded classes on hr’s
                    $menu.find('hr').removeClass('padded');

                    // Get the correct ul to play with in the menu container
                    var $origUl = $menu.find('a[data-action="add"]').parents('li').parent('ul');

                    // Loop the given block type data and adjust the menu to match the groups
                    for (var i = 0; i < spoonedBlockTypes.length; i++)
                    {
                        var handle = spoonedBlockTypes[i].matrixBlockType.handle;

                        // Make a new group ul if needed
                        if ( $menu.find('[data-spooned-group="'+spoonedBlockTypes[i].groupName+'"]').length === 0 )
                        {
                            var nestedSettingsHandles = $.grep(this.settings.nestedSettingsHandles, function(a){ return a === matrixFieldHandle; });
                            if (nestedSettingsHandles.length) {
                                var $newUl = $('<ul class="padded hidden" data-spooned-group="'+spoonedBlockTypes[i].groupName+'" />');
                                if (i!==0)
                                {
                                    $('<hr/>').insertBefore($origUl);
                                }

                                var $groupHeading = $('<a class="fieldtoggle">' + Craft.t('site', spoonedBlockTypes[i].groupName) + '</a>');
                                $groupHeading.insertBefore($origUl);

                                $newUl.insertBefore($origUl);

                                this.addListener($groupHeading, 'click', function(event) {
                                    var $trigger = $(event.currentTarget),
                                        $target = $trigger.next('ul');

                                    if ($target.hasClass('hidden')) {
                                        $target.removeClass('hidden');
                                        $trigger.addClass('expanded');
                                    } else {
                                        $target.addClass('hidden');
                                        $trigger.removeClass('expanded');
                                    }
                                });
                            } else {
                                var $newUl = $('<ul class="padded" data-spooned-group="'+spoonedBlockTypes[i].groupName+'" />');
                                if (i!==0)
                                {
                                    $('<hr/>').insertBefore($origUl);
                                }
                                $('<h6>' + Craft.t('site', spoonedBlockTypes[i].groupName) + '</h6>').insertBefore($origUl);
                                $newUl.insertBefore($origUl);
                            }

                        }

                        // Add the li
                        var $li = $menu.find('a[data-type="'+handle+'"]').parents('li');

                        $newUl.append($li);
                        $li.removeClass('hidden');
                    }

                }, this));
            },

            /**
             * This simply returns a fieldHandle if it can get one or false if not
             */
            _getMatrixFieldName: function($matrixField)
            {

                var matrixFieldId = $matrixField.parentsUntil('.field').parent().prop('id'),
                    parts = matrixFieldId.split("-");

                // Matrix inside Something (e.g. Super Table) inside Matrix
                if (parts.length === 9) {
                    var matrixFieldHandle = parts[parts.length-8] + '-' + parts[parts.length-5] + '-' + parts[parts.length-2];
                }
                // Matrix inside Something (e.g. Super Table)
                else if (parts.length === 6) {
                    var matrixFieldHandle = parts[parts.length-5] + '-' + parts[parts.length-2];
                }
                // Normal Matrix
                else if (parts.length === 3) {
                    var matrixFieldHandle = parts[parts.length-2];
                }

                if ( matrixFieldHandle !== '' )
                {
                    return matrixFieldHandle;
                }
                else
                {
                    return false;
                }
            },

            /**
             * Returns the block type handle for a given $matrixBlock
             */
            _getMatrixBlockTypeHandle: function($matrixBlock)
            {
                var blockTypeHandle = $matrixBlock.data('type');

                if ( typeof blockTypeHandle == 'string' )
                {
                    return blockTypeHandle;
                }
                else
                {
                    return false;
                }
            }

        },
        {
            defaults: {
                blockTypes: null,
                context: false,
                versioned: false,
                nestedSettingsHandles: []
            }
        });

})(jQuery);
