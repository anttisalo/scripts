

    var Portal = {
    
        baseUrl     : '',
        
        Application : {},
        Library     : {},

       /**
        * Build
        */
        build:function()
        {
            // Build main navigation
            this.MainNavi.build();
            
            this.buildModule('LiveSearch');      // Build livesearch
            this.buildModule('PageTabs');        // Build page tabs
            this.buildModule('ContentTabs');     // Content tabs
            this.buildModule('Previews');        // Build overlay previews
            this.buildModule('Stamps');          // Build input watermarks
            this.buildModule('ToolTip');         // Build tooltip hints
            this.buildModule('Expander');        // Build expanding elements
            this.buildModule('ImageGrid');       // Build imagegrids
            this.buildModule('LinkStyles');      // Build linkstyles
            this.buildModule('FancyCheck');      // Build fancy checkboxes
            this.buildModule('FancySelects');    // Build fancy select menus
            this.buildModule('ViewElements');    // Elements in active viewport
            this.buildModule('BulletinAlert');   // Build bulletin alerts
        },
        
        
       /**
        * Build module
        * @param string name target module name
        */
        buildModule:function(name)
        {
            if (this.hasOwnProperty(name))
            	this[name].build();
        }
    };


    Portal.PageTabs = {

        currentIndex : null,  // Currently selected tab index


       /**
        * Build
        */
        build:function()
        {
            // Show first tab by default
            this.update(window.location.hash);
        },


       /**
        * Show specified tab
        * @param int index new tab index number
        */
        show:function(index)
        {
            // Unselect and hide currently selected tab
              $('li.current_tab_item').removeClass('current_tab_item');
               $('div.tabcontent').hide();

            // Remember new tab
            this.currentIndex = index;

            // Select and show new tab
            $('#tab-link-' + this.currentIndex).addClass('current_tab_item');
              $('#desc' + this.currentIndex).show();
        },


       /**
        * Update tab selection to match hash in URL
        * @param string hash URL hash to parse
        * @return bool false to cancel event
        */
        update:function(hash)
        {
            var hash  = hash.split('#').join('');
            var index = parseInt(hash);
            this.show(!isNaN(index) ? index : 1)
            
            return false;
        }
    };


    Portal.ToolTip = {

       /**
        * Build
        */
        build:function()
        {
            var self = this;

            // Find untyped definitions from page content
            $(document).find('dfn[rel!=tooltip]').each(function(i, item)
            {
                if (item.innerHTML.length)
                    $(item).addClass('ui-tooltip').attr('rel', 'tooltip');
            });

            // Find definition tags from the page
            $(document).find('dfn[rel=tooltip]').each(function(i, item)
            {
                self.buildItem($(item));
            });
        },


       /**
        * Build item
        * @param object item definition jQuery node
        */
        buildItem:function(item)
        {
            var self = this;
             
            // Get text from tag
            var label = jQuery.trim(item.text());
            var text  = jQuery.trim(item.attr('title'));
            
            // No tooltip to display, leave alone
            if (!text.length)
                return;

            // Remove title
            item.removeAttr('title');

            // When mouse enters the item
            item.mouseenter(function(e)
            {
                self.showTip(item, label, text);
            });

            // When mouse leaves the item
            item.mouseleave(function(e)
            {
                self.hideTip();
            });
        },


       /**
        * Hide tip description
        */
        hideTip:function()
        {
            this.htmlTip.hide();
        },


       /**
        * Show tip description
        * @param object node source jQuery node
        * @param string label tooltip label
        * @param string text tooltip text to display
        */
        showTip:function(node, label, text)
        {
            // Build tooltip once
            if (!this.htmlTip)
            {
                this.htmlTip = $('<div>').
                    attr('class', 'ui-tooltip').
                    appendTo(document.body).
                    hide();
            }
             
            // Format content
            label = label.length ? '<h4>' + label + '</h4>' : '';
            text  = '<p>' + text.split("\n").join('<br />') + '</p>';
             
            // Update tip content
            this.htmlTip.html(label + text);

            // Get element position and size
            var ePos   = node.offset();
            var eWidth = node.width();

            // Get tooltip dimensions
            var tWidth  = this.htmlTip.width();
            var tHeight = this.htmlTip.height();

            // Default position: right top corner
            var x = ePos.left + eWidth + 10;
            var y = ePos.top - tHeight - 40;

            // Not enough space, move to left side
            if (x + tWidth + 70 > $(window).width())
                x = ePos.left - tWidth + 5;

            // Not enough space, move to bottom
            if (ePos.top - $(window).scrollTop() - 35 < tHeight)
                y = ePos.top + 25;

            // Update position and show
            this.htmlTip.
                css('left', x).
                css('top', y).
                show();
        }
    };


    Portal.Previews = {

        bgWidth       : 30,    // Loading background width in pixels
        bgHeight      : 30,    // Loading background height in pixels
        cacheList     : {},    // Collection of cached data
        contentWidth  : 0,     // Content width in pixels
        contentHeight : 0,     // Content height in pixels
        contentNode   : null,  // Current content jQuery node
        contentType   : '',    // Current content type
        hasMask       : false, // Internal flag to see if mask is in use
        hasOverlay    : false, // Internal flag to see if overlay is in use


       /**
        * Build
        */
        build:function()
        {
            var self = this;

            // Find links
            $(document).find('a').each(function(i, item)
            {
                self.buildItem($(item));
            });
        },


       /**
        * Close preview
        */
        close:function()
        {
            // Update states
            this.hasMask = false;
            this.hasOverlay = false;
            
            // Move original HTML-node back document body
            // before removing it
            if (this.contentType == 'html')
            {
                this.contentNode.hide();
                $(document.body).append(this.contentNode);
            }
            
            // Clear content
            this.htmlContent.empty();

            // Hide elements
            this.htmlMask.hide();
            this.htmlOverlay.hide();
        },


       /**
        * Build link item to open dialog
        * @param object item definition jQuery node
        * @internal
        */
        buildItem:function(item)
        {   
            var self = this;
            
            // Parse link properties
            var link = this.getLinkProperties(item);

            // Unable to parse
            if (link === null)
                return;
            
            // Already processed
            if (item.hasClass('portal-previews-processed'))
            	return;
           
            // Add class
            item.addClass('portal-previews-processed');            
            
            // Add event handler to item
            item.click(function(e)
            {
                e.preventDefault();
                self.open(link);
            });
        },


       /**
        * Build mask
        * @internal
        */
        buildMask:function()
        {
            var self = this;

            // Built only once
            if (this.htmlMask)
                return;

            // Create mask
            this.htmlMask = $('<div>').
                attr('id', 'portal-preview-mask').
                css('opacity', 0.4).
                click(function(e)
                {
                    self.close();
                }).
                appendTo(document.body);

            // Listen to window resizing
            $(window).resize(function()
            {
                 self.onResize();
            });
        },


       /**
        * Build overlay
        * @internal
        */
        buildOverlay:function()
        {
            var self = this;

            // Built only once
            if (this.htmlOverlay)
                return;

            // Build container
            this.htmlOverlay = $('<div>').
                attr('id', 'portal-preview-overlay').
                appendTo(document.body);

            // Build close-link
            this.htmlClose = $('<a>').
                attr('href', '#sulje').
                attr('class', 'close').
                attr('title', 'Sulje tämä ikkuna').
                click(function(e)
                {
                    e.preventDefault();
                    self.close();
                }).
                appendTo(this.htmlOverlay);

            // Build background
            this.htmlBackground = $('<div>').
                attr('class', 'background').
                appendTo(this.htmlOverlay);

            // Build content
            this.htmlContent = $('<div>').
                attr('class', 'content').
                appendTo(this.htmlOverlay);
        },


       /**
        * Build overlay
        * @param object params preview parameters, see open()
        * @internal
        */
        buildPreview:function(params)
        {
            var self = this;

            // Build elements
            this.buildMask();
            this.buildOverlay();

            // Reset to initial state
            this.reset();

            // Resize mask to fill page
            this.onResize();

            // Fade in mask
            this.htmlMask.fadeIn('slow', function()
            {
                // Update status
                self.contentType = params.type;
                
                // Load image
                if (params.type == 'image')
                    self.loadImage(params.url);

                // Load page
                else if (params.type == 'page')
                    self.loadPage(params.url);

                // Load HTML
                else if (params.type == 'html')
                {
                	if (!params.hasOwnProperty('width'))
                		params.width = params.node.outerWidth();
                	
                	if (!params.hasOwnProperty('height'))
                		params.height = params.node.outerHeight();
                	
                    self.loadHtml(params.node, params.width, params.height);
                }

                // Load iframe
                else if (params.type == 'iframe')
                    self.loadIframe(params.url, params.width, params.height);
             });
         },
         
         
       /**
        * Resolve preview properties from given link node
        * @param object item link jQuery node
        * @return object|null preview properties or null on failure
        * @internal
        */
        getLinkProperties:function(item)
        {
            var m;
            var url;
            var rel;

            var link = null;

            // Get target URL
            url = item.attr('href');
            url = typeof url == 'string' ? url : '';

            // Get rel-attribute
            rel = item.attr('rel');
            rel = typeof rel == 'string' ? rel : '';

            // Item is an image
            if (rel && url && url.match(/\.(jpg|gif|png|jpeg)/))
                link = {url:url, type:'image'};

            // Item is an iframe
            else if (rel && (m = rel.match(/preview\[([0-9]{1,})\x([0-9]{1,})\]/)))
                link = {url:url, type:'iframe', width:parseInt(m[1]), height:parseInt(m[2])};

            // Item is a local page
            else if (rel == 'preview' && (url.indexOf('/') === 0 || url.indexOf('http://www.sonera.fi') === 0 || url.indexOf('http://www.preprod.sonera.fi') === 0))
                link = {url:url, type:'page'};
            
            // Item is a popup window
            else if (rel && (m = rel.match(/popup\[([0-9]{1,})\x([0-9]{1,})\]/)))
                link = {url:url, type:'popup', width:parseInt(m[1]), height:parseInt(m[2])};

            return link;
        },
        

       /**
        * Get proper overlay position based on current size
        * @return object correct position
        *                - int left new left position
        *                - int top  new top position
        * @internal
        */
        getPosition:function()
        {
            // Current dimensions
            var wWidth  = $(window).width();
            var wHeight = $(window).height();
            var wScroll = $(window).scrollTop();

            // Resolve new overlay position
            var newX = Math.floor((wWidth - this.contentWidth) / 2);
            var newY = Math.floor(wScroll + (wHeight - this.contentHeight) / 2);
            
            // Make sure the y-coordinate is never above 
            // currently scrolled position on the page
            newY = Math.max(wScroll + 20, newY);

            return {left:newX, top:newY};
        },


       /**
        * Load and show target HTML-element
        * @param object node content element as jQuery node
        * @param int width content width
        * @param int height content height
        * @internal
        */
        loadHtml:function(node, width, height)
        {
            // Update references
            this.contentNode = node;
            
            // Create content container
            var content = $('<div>').
                attr('class', 'portal-preview-html').
                css('width', width).
                css('height', height).
                appendTo(this.htmlContent);

            // Add content
            content.append(node.show());

            // Set new content size
            this.contentWidth  = width;
            this.contentHeight = height;

            // Show content
            this.showContent();
        },


       /**
        * Load and show target iframe
        * @param string url URL to target iframe
        * @param int width iframe width
        * @param int height iframe height
        * @internal
        */
        loadIframe:function(url, width, height)
        {
            var self = this;

            // Local URL without fixed size
            if (url.indexOf('/') === 0 && !width && !height)
            {
                // Open with a page preview
            	if (url.indexOf('/OmatSivut') < 0)
            		url = '/sonerafi/siteutil/preview/page.jsp?path=' + escape(url.split('?').shift()) + '&' + url.split('?').pop();

                // Create iframe into content
                var iframe = $('<iframe>').
                    //css({width:960}).
                    load(function()
                    {
                        // @note: we are assigning a repeating -loadevent
                        //        on purpose to resize dialog after reloads

                        // Get root element size
                    	var root   = iframe.contents().find('body *:visible:first');
                    	var width  = root.outerWidth(true);
                    	var height = root.outerHeight(true);

                        // Update iframe size
                        iframe.css({width:width, height:height});

                        // Set new content size
                        self.contentWidth  = width;
                        self.contentHeight = height;

                        // Show content
                        self.showContent();
                    }).
                    attr({src:url, frameBorder:0, scrolling:'no'}).
                    appendTo(this.htmlContent);
            }
            // Remote URL
            else
            {
                // Create iframe into content
                $('<iframe>').
                    attr('src', url).
                    attr('frameborder', 0).
                    attr('scrolling','no').
                    css('width', width).
                    css('height', height).
                    appendTo(this.htmlContent);

                // Set new content size
                this.contentWidth  = width;
                this.contentHeight = height;

                // Show content
                this.showContent();
            }
        },


       /**
        * Load and show target image
        * @param string url URL to target image
        * @internal
        */
        loadImage:function(url)
        {
            var self = this;

            // Create imagenode into content
            var image = $('<img>').
                attr('src', url).
                appendTo(this.htmlContent);

            // Check periodically until the content
            // image size has changed (because the
            // load event is _really_ unreliable)
            var timer = window.setInterval(function()
            {
                // Not ready yet
                if (!image.width() > 1)
                    return;

                // Remove timer
                clearInterval(timer);

                // Set new content size
                self.contentWidth = image.width();
                self.contentHeight = image.height();

                // Show content
                self.showContent();

            }, 200);
        },


       /**
        * Load and show target iframe
        * @param string url URL to target iframe
        * @internal
        */
        loadPage:function(url)
        {
            var self = this;

            // Custom callback to call after remote
            // data has been loaded
            var callback = function(data)
            {
                // When data is empty, there was an error
                // retrieving the page and we should open
                // the page instead of showing an empty layer
                if (!data)
                {
                    self.close();
                    location.href = url;
                }
                else
                {
                    // Create content container
                    var content = $('<div>').
                        attr('class', 'portal-preview-page').
                        html(data).
                        appendTo(self.htmlContent);

                    // Set new content size
                    self.contentWidth  = content.outerWidth();
                    self.contentHeight = content.outerHeight();

                    // Show content
                    self.showContent();
                }
            };

            // This page data has already been fetched,
            // use cached instead of calling it again
            if (typeof this.cacheList[url] == 'string')
                return callback(this.cacheList[url]);

            // Load page content and cache it to local
            // variable scope for future requests
            var path = url.
                split('http://www.sonera.fi').join('').
                split('http://www.preprod.sonera.fi').join('');

            // Get content without layout by default
        	var pageUrl = '/sonerafi/siteutil/preview/page.jsp?path=' + path;
            
            // Get special offer details without layout
            if (path.indexOf('/palvelu/tarjousehdot/') === 0)
            	pageUrl = '/common/application/ashopoffer/application.php?path=' + escape(path);
            
            // Use full URL
            else if (path.indexOf('/palvelu/') === 0)
            	pageUrl = path;
            
            // Get data from remote URL 
            $.get(pageUrl, function(data)
            {
                self.cacheList[url] = jQuery.trim(data);
                callback(self.cacheList[url]);
            });
        },


       /**
        * Open URL in preview
        * @param object params preview parameters
        *               - string url      target URL to open
        *               - string type     target type (image|iframe|page|html|popup)
        *               - object node     reference to target jQuery node when type=html
        *               - int    [width]  iframe width
        *               - int    [height] iframe height
        *               - float  [delay]  amount of seconds to delay opening layer
        */
        open:function(params)
        {
    		// Wait a moment before opening content
        	if (params.hasOwnProperty('delay'))
        	{
        		window.setTimeout(function()
        		{
        			delete params.delay;
        			Portal.Previews.open(params);
        			
        		}, params.delay * 1000);
        	}
        	
        	// Open popup window
        	else if (params.type == 'popup')
	        	this.openPopup(params);
	
        	// Open layer
        	else
        		this.buildPreview(params);
        },
        
        
       /**
        * Open preview using properties from link node
        * @param object link target jQuery link node
        * @return bool preview was opened
        */
        openLink:function(link)
        {
            // Parse link properties
            var params = this.getLinkProperties(link);

            // Unable to parse
            if (params === null)
                return false;

            // Open properties
            this.open(params);
            return true;
        },


       /**
        * When window is resized
        */
        onResize:function()
        {
            // Resize mask to fill page
            if (this.hasMask)
                this.htmlMask.css('height', $(document).height());

            // Autocenter overlay when it's visible
            if (this.hasOverlay)
                this.htmlOverlay.css(this.getPosition());
        },
        
        
       /**
        * Open popup window
        * @param object params link parameters
        *                - string url target URL to open
        *                - int    width  window width
        *                - int    height window height
        */
        openPopup:function(params)
        {
            // Autocenter
            params.left = Math.floor((screen.width - params.width) / 2);
            params.top  = Math.floor((screen.height - params.height) / 2);
       
            // Try to open window
            var popup = window.open(
                params.url,
                'popup',
                'bookmarks=no,' +
                'directories=no,' +
                'location=no,' + 
                'menubar=no,' +
                'resizable=yes,' +
                'scrollbars=yes,' + 
                'status=no,' +
                'toolbar=no,' +
                'left=' + params.left + ',' + 
                'top=' + (params.top - 20) + ',' + 
                'width=' + params.width + ',' +
                'height=' + params.height
            );
                   
            // Success
            if (popup)
            	popup.focus();
        },


       /**
        * Reset elements to initial state
        * @internal
        */
        reset:function()
        {
            // Reset states
            this.hasMask = true;
            this.hasOverlay = false;

            // Reset content width
            this.contentWidth = this.bgWidth;
            this.contentHeight = this.bgHeight;

            // Reset container to default state
            // where it fills the page
            this.htmlOverlay.show().css({
                left   : 0,
                top    : 0,
                width  : '100%',
                height : '100%'
            });

            // Hide elements
            this.htmlMask.hide();
            this.htmlClose.hide();

            // Remove content and hide container
            this.htmlContent.empty().css('visibility', 'hidden');

            // Reset background to default state at the
            // center of the page to wait for the content
            // to be ready (loader)
            this.htmlBackground.css({
                left   : this.getPosition().left,
                top    : this.getPosition().top,
                width  : this.bgWidth,
                height : this.bgHeight
            });
        },


       /**
        * Show loaded content
        */
        showContent:function()
        {
            var self = this;

            // Update state
            this.hasOverlay = true;

            // Update container size and position
            this.htmlOverlay.css({
                left   : this.getPosition().left,
                top    : this.getPosition().top,
                width  : this.contentWidth,
                height : this.contentHeight
            });

            // Resize and re-position background to center
            this.htmlBackground.css({
                left   : Math.ceil((this.contentWidth - this.bgWidth) / 2),
                top    : Math.ceil((this.contentHeight - this.bgHeight) / 2),
                width  : this.bgWidth,
                height : this.bgHeight
            });

            // Define dimensions and position to animate to
            var finish = {
                left   : 0,
                top    : 0,
                width  : this.contentWidth - 2,
                height : this.contentHeight
            };

            // Animate the background
            this.htmlBackground.animate(finish, 'fast', function()
            {
                // Ensure background is at the final size
                self.htmlBackground.css(finish);

                // Show close icon and content
                self.htmlClose.show();
                self.htmlContent.css('visibility', 'visible');

                // Autofocus to first field, if any
                self.htmlContent.find('input[type=text]:first').focus();
            });
        }
    };


    Portal.MainNavi = {

        activeIndex : null,  // Currently active item index
        columnWidth : 185,   // Column width in pixels
        hideTimer   : null,  // Internal timer to hide a menu flyer
        itemList    : [],    // List of menu items
        isOpened    : false, // Is menu currently opeend
        naviX       : 0,     // Navigation container x-coordinate position
        naviWidth   : 0,     // Navigation container width
        showTimer   : null,  // Internal timer to show a menu flyer
        useTouch    : false, // Is touch enabled version


       /**
        * Autohide menu when clicked anywhere else than
        * inside the flyer menu
        * @param object e jQuery event object
        * @internal
        */
        autoHide:function(e)
        {
            // Menu is not open, ignore
            if (!Portal.MainNavi.isOpened)
                return;

            // Clicked outside the main navigation, hide menu
            if (!$(e.target).closest('nav#mainnav').length)
                Portal.MainNavi.hideMenu(Portal.MainNavi.activeIndex);
        },


       /**
        * Build
        */
        build:function()
        {
            var self = this;
            
            var hasActive = false;

            // Get container
            var htmlNavi   = $('nav#mainnav div.container:first');

            // Wait - there is no navigation so we should not continue
            if (!htmlNavi.length)
                return;

            // Get position and size
            this.naviX     = htmlNavi.offset().left;
            this.naviWidth = htmlNavi.width();
            
            // Build top navigation buttons
            $('#topnav li.portal-topnavi-button').each(function(i, item)
            {
            	self.buildTopNaviButton($(item));
            });
            
            // Build top shopping cart button
            $('#topnav li.portal-topnavi-cart').each(function(i, item)
            {
            	self.buildTopNaviCart($(item));
            });

            // Find main items from the menu
            $('nav#mainnav li.mainsection').each(function(i, item)
            {
                // Get jQuery node
                item = $(item);

                // When mouse enters main menu item
                item.mouseenter(function()
                {
                    self.showMenu(i);
                });

                // When mouse leaves main menu item
                item.mouseleave(function()
                {
                    self.hideMenu(i);
                });

                // Add to list
                self.itemList.push({
                    link    : item,
                    hyper   : item.find('a.mainlink:first'),
                    flyer   : item.find('ul.flymenu:first'),
                    list    : item.find('li.column'),
                    banners : item.find('li.banner').length ? 1 : 0,
                    columns : 0,
                    height  : 0,
                    items   : []
                });
                
                // Check for active page if we dont' have one yet
                if (!hasActive)
                {
                	if (self.updateActiveState(i))
                		hasActive = true;
                }

                // Reposition elements inside the flyer
                self.orderMenu(i);

                // Prepare flyer
                self.prepareFlyer(i);
            });

            // Enable touch
            if ($('html:first').hasClass('touch'))
                this.buildTouch();
        },
        
        
       /**
        * Build top navigation button
        * @param object container button container node
        * @internal
        */
        buildTopNaviButton:function(container)
        {
        	// Get elements
        	var button   = container.children('a.menubutton:first');
        	var menulist = container.children('div.menulist:first');
        	
			// Initiatel list
			menulist.addClass('hidden');
        	
        	// When clicked
        	button.bind('click', function(e)
       		{
                // Cancel default behaviour
       			e.preventDefault();
       			
       			// Menulist is currently visible, do nothing
       			if (menulist.hasClass('visible'))
       				return;
       			
				// Show list
   				menulist.
   					addClass('visible').
   					removeClass('hidden');
 					
   				// Hide if clicked anywhere on page
				window.setTimeout(function()
       			{
	       		    $(document).one('click', function()
	       			{
	       			    menulist.
	       				    addClass('hidden').
	       					removeClass('visible');
       				});
	       				
   				}, 150);
       			
       		});
        	
            // When touched
            button.bind('touchstart', function(e)
            {
                // Cancel default behaviour
                e.preventDefault();
                
                // Execute click event
                button.trigger('click');
            });
        	
        	// Show container
        	container.show();
        },
        
        
       /**
        * Build top navigation cart button
        * @param object container button container node
        * @internal
        */
        buildTopNaviCart:function(container)
        {
        	// Resolve current environment 
        	var isProduction = (
        		location.href.indexOf('www4.sonera.fi') > -1 || 
        		location.href.indexOf('www.sonera.fi') > -1
        	);
        	
        	// Resolve 
        	var baseUrl = isProduction ?
        		'https://yrityskauppa1.sonera.fi' : 
        		'https://yrityskauppa1.test.sonera.fi';
        	
        	// Target URLs
        	var shopUrl = baseUrl + '/kauppa/view-cart.ep';
        	var portalUrl = null;
        	
        	// Check if we are using soho 
        	if (document.cookie.indexOf('segment-sonera_b2b=soho') > -1 && location.href.match(/yrityksille\/[a-z]{1,}/i) !== null)
        		portalUrl = '/yrityksille/yritysverkkokauppa?intcmp=b2b-soho-ostoskori';
        	
        	// Call remote service
        	$.ajax({
        		url      : baseUrl + '/kauppa/minishoppingcart.ep',
        	    jsonp    : 'callback',
        	    dataType : 'jsonp',
        	    success  : function(response)
        	    {
        	    	// Response is not a valid object
        	    	if (!jQuery.isPlainObject(response))
        	    		return;
        	    	
        	    	//  Response does not have amount property
        	    	if (!response.hasOwnProperty('itemsincart'))
        	    		return;
        	    	
        	    	// Get amount
        	    	var amount = parseInt(response.itemsincart);
        	    	
        	    	// Not a numeric value
        	    	if (isNaN(amount))
        	    		return;
        	    	
        	    	// Empty amount and no portal URL defined
        	    	if (amount === 0 && portalUrl === null)
        	    		return;
        	    	
        	    	// Build link to container
        	    	var link = $('<a>').
        	    		attr('href', (amount > 0 ? shopUrl : portalUrl)).
        	    		appendTo(container);
        	    	
        	    	// Add amount 
        	    	$('<span>').
        	    		html(amount).
        	    		appendTo(link);
        	    	
        	    	// Show container
        	    	container.show();
        	    }
        	});
        },


       /**
        * Enable touch behaviours in menu
        * @internal
        */
        buildTouch:function()
        {
            var self = this;

            // Remember state
            this.useTouch = true;

            // Go trough main items
            jQuery.each(this.itemList, function(i, item)
            {
                var time;

                // Remove target from the link
                var url = item.hyper.attr('href');
                item.hyper.removeAttr('href');

                // Attach touch event behaviour that detects
                // when main link is tapped or doubletapped
                item.hyper.bind('touchstart', function(e)
                {
                    // Cancel default behaviour
                    e.preventDefault();

                    // Show target menu
                    self.showMenu(i);

                    // Get current timestamp
                    var now = new Date().getTime();

                    // Already clicked once, check if the
                    // difference between timestamps was short
                    // enought to count as doubleclick
                    if (time && now - time < 250)
                        location.href = url;

                    // Update time
                    time = now;
                });
            });
        },


       /**
        * Order items inside a specified menu flyer
        * @param int i target menu item index number
        */
        orderMenu:function(i)
        {
            var self = this;

            // Reserved space for banners inside flyer
            var bannerWidth  = 220 * this.itemList[i].banners;
            var bannerHeight = 360 * this.itemList[i].banners;

            // Temporarily show the flyer but hide it,
            // so that items inside it can be measured
            this.itemList[i].flyer.show().css('visibility', 'hidden');

            // Get section heights for each flyer section
            this.itemList[i].list.each(function(index, section)
            {
                self.itemList[i].items[index] = $(section).height();
            });

            // No items to display, hide flyer and ignore further computing
            if (!self.itemList[i].items.length)
                return this.itemList[i].flyer.css({width:1}).hide();

            // Number of sections available
            var sectionCount = this.itemList[i].items.length;

            // Default amount of columns to use
            var columnCount = 4;

            // One column should be used
            if (sectionCount < 2)
                columnCount = 1;

            // Two columns should be used
            else if (sectionCount == 2 || sectionCount == 3)
                columnCount = 2;
            
            // Three column should be used with five
            else if (sectionCount == 5)
                columnCount = 3;

            // Three column should be used
            else if (sectionCount < 9 && sectionCount % 3 == 0)
                columnCount = 3;
            
            // Amount of rows used
            var rowHeight = {};
            var rowAmount = Math.max(1, Math.ceil(sectionCount / 4));

            // Defaults
            var currRow = 0;

            // Resolve row-specific heights
            jQuery.each(this.itemList[i].items, function(index, height)
            {
                // Update active row
                currRow = Math.ceil((index + 1) / columnCount);

                // Create initial row height
                if (!rowHeight.hasOwnProperty(currRow))
                	rowHeight[currRow] = 0;

                // Resolve row-specific max-height
                rowHeight[currRow] = Math.max(
                	rowHeight[currRow], height
                );
            });
            
            // Adjust row heights
            this.itemList[i].list.each(function(index, section)
            {
                // Update active row
                currRow = Math.ceil((index + 1) / columnCount);

                // Adjust section
                $(section).removeAttr('style').css('height', rowHeight[currRow]);
            });

            // Defaults
            var flyerWidth = 0;
            var flyerHeight = 0;
            
            // Resolve flyer height
            jQuery.each(rowHeight, function(index, height)
            {
            	flyerHeight += height;
            });
            
            // Resolve dimensions
            flyerWidth  = columnCount * this.columnWidth + bannerWidth;
            flyerHeight = Math.max(bannerHeight, flyerHeight);
            
            
            // Increase banner height to match flyer height
            if (this.itemList[i].banners > 0 && flyerHeight > bannerHeight)
            {
            	this.itemList[i].flyer.
            		find('li.banner').
            		css('min-height', flyerHeight - 40);
            }

            // Resolve position
            var flyerX = this.itemList[i].link.offset().left;

            // Align to right edge when necessary
            if (flyerX + flyerWidth > this.naviX + this.naviWidth)
                flyerX = 0 - ((flyerX + flyerWidth) - (this.naviX + this.naviWidth));

            // Update flyer style and height
            this.itemList[i].flyer.
                attr('class', 'flymenu col' + columnCount).
                css({
                    visibility : 'visible',
                    left       : Math.min(flyerX, 0),
                    width      : flyerWidth,
                    height     : flyerHeight
                }).
                hide();
        },


       /**
        * Prepare flyer to be visible on top of flash
        * @param int i target menu item index number
        */
        prepareFlyer:function(i)
        {
            // By default, hide the flyer
            this.itemList[i].flyer.hide();

            // @note: iframe behind the flyer is currently required
            //        only when page contains a flash-hero, usually
            //        an application-campaign

            // No campaign-application, ignore
            if (!$('#application-campaign').length)
                return;

            // Create container that
            var container = $('<div>').
                attr('class', 'iframe').
                css({
                    width  : this.itemList[i].flyer.outerWidth() - 2,
                    height : this.itemList[i].flyer.outerHeight() - 2
                }).
                prependTo(this.itemList[i].flyer);

            // Create iframe
            $('<iframe>').
                attr('frameborder', 0).
                prependTo(container);
        },


       /**
        * Show specified menu item
        * @param int i target menu item index number
        */
        showMenu:function(i)
        {
            var self = this;

            // Duplicate call, ignore
            if (this.activeIndex === i)
                return;

            // Set new menu
            this.setMenu(i);
            
            // Hide all menus
            jQuery.each(this.itemList, function(index, item)
            {
            	item.flyer.hide();
            });

            // Wait - there is no need to show a flyer
            // as there are no items to display inside
            if (!this.itemList[i].items.length)
                return;

            // Show menu flyer with a delay
            this.showTimer = window.setTimeout(function()
            {
                // Update state
                self.isOpened = true;

                self.itemList[i].flyer.stop().fadeIn(100, function()
                {
                    // Backup: when moving really fast, the animation
                    // sometimes does not finish back to 1.0 opacity
                    self.itemList[i].flyer.css('opacity', 1);
                });

            }, 10);

            // When clicked anywhere outside the menu, close the menu
            if (this.useTouch)
                $(document).bind('touchstart', this.autoHide);
        },


       /**
        * Hide specified menu item
        * @param int i target menu item index number
        */
        hideMenu:function(i)
        {
            var self = this;

            // Update state
            this.isOpened = false;

            // Hide menu flyer with a delay
            this.hideTimer = window.setTimeout(function()
            {
                // Reset menu
                self.setMenu(null);
                
                // Fade out
                self.itemList[i].flyer.stop().fadeOut(50, function()
                {
                	self.itemList[i].flyer.hide();
                });

            }, 500);
        },


       /**
        * Switch to new menu
        * @param int i target menu item index number
        * @internal
        */
        setMenu:function(i)
        {
            // Clear old show timer, if any
            if (this.showTimer)
                window.clearTimeout(this.showTimer);

            // Clear old hide timer, if any
            if (this.hideTimer)
                window.clearTimeout(this.hideTimer);

            // Remove any existing autohiding event
            if (this.useTouch)
                $(document).bind('touchstart', this.autoHide);

            // Remember new item index
            this.activeIndex = i;

            // Unselect all items
            for (var j = 0; j < this.itemList.length; ++j)
            {
                this.itemList[j].link.removeClass('hoveritem');
                this.itemList[j].hyper.blur();
            }

            // Set new item as active
            if (this.activeIndex !== null)
                this.itemList[this.activeIndex].link.addClass('hoveritem');
        },
        
        
       /**
        * Update active state of a menu item
        * @param int index target menu item index number
        * @return bool is active
        * @internal
        */
        updateActiveState:function(index)
        {
        	var self = this;
        	
        	// Default result
        	var result = false;
        	
        	// Resolve active path
        	var path = location.href;
        	
    		// Clean path from additional variables
        	path = path.split('?').shift();
        	path = path.split('#').shift();
        			
        	// Find links inside flyer
        	this.itemList[index].flyer.find('a').each(function(i, item)
        	{
        		// We are done
        		if (result)
        			return;
        		
        		// Get references
        		var link = $(item);
        		var href = link.attr('href');
        		
        		// No link
        		if (!href)
        			return;
        		
        		// Clean link from variables
        		href = href.split('?').shift();
        		href = href.split('#').shift();

        		// Link does not match active URL
        		if (path == href || path.indexOf(href) > -1)
        			result = true;
        		
        		// Mark as active        		
        		if (result)
        		{
	        		link.addClass('current-page');
	        		self.itemList[index].link.addClass('current-page');
        		}
        	});
        	
        	return result;
        }
    };


    Portal.Stamps = {

        formList : [],     // List of form-specific fields


       /**
        * Build
        */
        build:function()
        {
            var self = this;

            // Find fields with alternative text defined
            // Find forms from page
            $('form').each(function(i, form)
            {
                // Get fields with waterstamp defined
                // inside this form
                var fields = $(form).find('input[alt]');

                // No suitable fields, abort
                if (!fields.length)
                    return;

                // Declare fieldlist for this form
                self.formList[i] = [];

                // Add event handlers to form
                self.buildForm(i, $(form));

                // Add event handlers to fields
                fields.each(function(j, field)
                {
                    self.buildItem(i, $(field));
                });
            });
        },


       /**
        * Build form event handlers handle default stamps
        * @param int formId target form id
        * @param object node form jQuery node
        * @internal
        */
        buildForm:function(formId, node)
        {
            var self = this;

            // When form is submitted
            node.submit(function(e)
            {
                // Clear waterstamp values from fields
                // and make fields look like disabled
                jQuery.each(self.formList[formId], function(i, item)
                {
                    // Remove focus from field
                    item.node.blur();

                    // Remove stamp value before submitting
                    if (jQuery.trim(item.node.val()) == item.stamp)
                        item.node.val('');

                    // Display as disabled
                    item.node.addClass('portal-stamp-disabled');
                });
            });
        },


       /**
        * Build field to have default stamp
        * @param int formId target form id
        * @param object node input jQuery node
        * @internal
        */
        buildItem:function(formId, node)
        {
            // Get stamp from field
            var stamp = node.attr('alt');

            // Remember field properties
            this.formList[formId].push({
                stamp : stamp,
                node  : node
            });

            // When focused
            node.focus(function()
            {
                // Remove stamp
                if (node.val() == stamp)
                    node.val('').removeClass('portal-stamp-blurred');
            });

            // When blurred
            node.blur(function()
            {
                // Get trimmed value
                var value = jQuery.trim(node.val());

                // Restore stamp
                if (!value.length || value == stamp)
                    node.val(stamp).addClass('portal-stamp-blurred');

            });

            // Set default state
            node.trigger('blur');
        }
    };


    Portal.Expander = {
        
    	hasBuilt : false,
        linkList : {},

       /**
        * Build
        */
        build:function()
        {
            var self = this;
            
            // Find expander links from the page
            $(document).find('a.portal-expander').each(function(i, item)
            {
                self.buildItem($(item));
            });

            // We have a hash string
			if (location.hash) 
			{	
				// Get target link
				var node = $('a[href$="' + location.hash + '"]');
				
				// Open specified link
			    node.click();
			    
			    // We have a location
				//if (node.offset() != null)
                    //$(window).scrollTop(node.offset().top - 15);
			}
            
            // Update state
            this.hasBuilt = true;
        },


       /**
        * Build item
        * @param object item target link jQuery node
        */
        buildItem:function(link)
        {
            var self = this;
            
            // Already processed
            if (link.hasClass('portal-expander-processed'))
            	return;
           
            // Add class
            link.addClass('portal-expander-processed');
            
            // Hash
            var hash = link.attr('href').split('#').pop();
            
            // Initiate linklist
            if (typeof this.linkList[hash] == 'undefined')
                this.linkList[hash] = [];
            
            // Add link to list
            this.linkList[hash].push(link);

            // Get reference to content node
            var content = $('#' + hash);

            // Display link and hide content
            link.show();
            content.hide();
            
            // Disable any iframes from loading their content
            // while container is hidden, an issue that creates
            // bugs on some external applications, like maps
            content.find('iframe').each(function(i, item)
            {
            	var url = $(item).attr('src');
            	$(item).attr('data-src', url);
            	$(item).removeAttr('src');
            });

            // When clicked, expand or collapse content
            link.click(function(e)
            {
                e.preventDefault();
                self.flip(hash);
            });
        },
        
        
       /**
        * Collapse link, if not already expanded
        * @param string hash target hash
        * @return bool false
        */
        collapse:function(hash)
        {
        	return this.flip(hash, false);
        },
        
        
       /**
        * Expand link, if not already expanded
        * @param string hash target hash
        * @return bool false
        */
        expand:function(hash)
        {
        	return this.flip(hash, true);
        },
        
        
       /**
        * Flip link
        * @param string hash target hash
        * @param bool [expand] force expanding or collapsing
        * @return bool false 
        */
        flip:function(hash, expand)
        {
            // Get reference to content node
            var content = $('#' + hash);

            // Check if content is currently shown
            var isShown = content.css('display') != 'none';
            
            // Flip state by default
            var showNow = !isShown;
            
            // We want to explicity expand or collapse
            if (typeof expand == 'boolean')
            {
            	// Expanding but already visible
            	if (expand && isShown)
            		return false;
            	
            	// Collapsing but already hidden
            	if (!expand && !isShown)
            		return false;
            	
            	// Show or hide
            	showNow = expand;
            }
            
            // Update link styles
            jQuery.each(this.linkList[hash], function(i, link)
            {
                link[(showNow ? 'addClass' : 'removeClass')]('portal-expander-collapse');
            });
            
            // Show content
            if (showNow)
            {
            	this.showFrames(content);
            	content.slideDown();
            }
            // Hide content
            else
            	content.slideUp();
            
            return false;
        },
        
        
       /**
        * Expand link, without animation
        * @param string hash target hash
        * @param bool [expand] force expanding or collapsing
        * @return bool false 
        */
        show:function(hash)
        {
        	this.build();
        	
            // Get reference to content node
            var content = $('#' + hash);

            // Update link styles
            jQuery.each(this.linkList[hash], function(i, link)
            {
                link.addClass('portal-expander-collapse');
            });

            // Show content
            this.showFrames(content);
            content.show();
             
            return false;
        },
        
        
       /**
        * Show frames inside specied element content
        * @param object content jQuery node for content container
        */
        showFrames:function(content)
        {
        	// Enable any possibly hidden iframes
            content.find(':not(iframe[data-src=""])').each(function(i, item)
            {
            	var url = $(item).attr('data-src');
            	$(item).attr('src', url);
            	$(item).removeAttr('data-src');
            });
        }
    };
    
    
    Portal.LinkStyles = {
    		
       /**
        * Build
        */
    	build:function()
    	{
    		var self = this;
    	        	
    	    // Find expander links from the page
    	    $(document).find('a.portal-link-popup').each(function(i, item)
    	    {
    	    	self.buildItem($(item));
    	    });
    	 },
    	        

       /**
    	* Build item
    	* @param object item target link jQuery node
    	*/
    	buildItem:function(link)
    	{
    		// Add title, if it does not exist
    	    if (!link.attr('title'))
    	    	link.attr('title', 'Linkki avautuu uuteen ikkunaan');
        }
    };


    // Trigger when document has been loaded
    $(document).ready(function()
    {
        Portal.build();
    });

