/*
*  jIceTabSet for jQuery, version 1.0b
*  (c) 2011 Ice Apps
*
*  jIceTabset is a tabset jQuery plugin.
*  For details, see the web site: http://jicetabset.sourceforge.net/
*
*  Last Review: 2011-10-03
*/

(function($)
{
    $.fn.jIceTabSet = function(options)
    {
		return this.each(function()
		{
            var tabObject = new $.jIceTabset(this, options);
            $(this).data('tabs', tabObject);
		});
	}
    
    $.jIceTabset = function (container, options) {
        var settings = $.extend({   
    			tabWidth: 200,
                showCloseButton: true,
                onchangeable: null,
                onchanged: null,
                onclosable: null,
                onclosed: null,
                tabs: []
    		},options || {});
			
        var self = this;
        this.items = [];
    	this.container = $(container);
        this.tabScroller = $("<div></div>").addClass("tabScroller").appendTo(self.container);
        this.containerInnerDiv = $('<div style="margin: 0;padding: 0;height: 25px;overflow: hidden"></div>').appendTo(self.container);
    	this.mainUL = $("<ul></ul>").appendTo(this.containerInnerDiv);
    	this.selectedTab = null;
        this.tabWidth = settings.tabWidth;
        this.tabLength = this.tabWidth + 16;
    
    	this.leftScrollButton = $("<div class='tabLeftScrollButton'></div>").appendTo(self.tabScroller).bind("click", function() {
    		var poz = parseInt(self.mainUL.css("margin-left"), 10);
    		if (poz < 0)
    		{
    			var diff = self.tabLength<-poz?self.tabLength:-poz;
    			self.mainUL.animate({"margin-left": "+=" + diff}, 400, function() {
    				self.updateScrollButtons();
    			});
    		}
    	});
    	this.rightScrollButton = $("<div class='tabRightScrollButton'></div>").appendTo(self.tabScroller).bind("click", function() {
    		var poz = parseInt(self.mainUL.css("margin-left"), 10);
    		if (-poz + self.container.width() + self.tabScroller.width() < (self.items.length * self.tabLength))
    		{
    			var diff = self.tabLength;
    			self.mainUL.animate({"margin-left": "-=" + diff}, 400, function() {
    				self.updateScrollButtons();
    			});
    		}
    	});
    	
    	
    	this.setTitle = function(tab, title) {
    		if (tab == null) return;
    		tab.title = title;
    		var span = tab.html.find("span.tabTitle");
    		span.text(tab.title);
    	} 
    	
    	this.updateScrollButtons = function() {
    		var poz = parseInt(this.mainUL.css("margin-left"), 10);
    		if (-poz + self.container.width() < (this.items.length * self.tabLength))
    			this.rightScrollButton.show();
    		else
    			this.rightScrollButton.hide();
    	
    		if (poz < 0)
    			this.leftScrollButton.show();
    		else
    			this.leftScrollButton.hide();
    	
    	}
    	
    	this.moveScrollToActiveTab = function() {
    		if (this.selectedTab)
    		{
    			var index = this.indexOf(this.selectedTab);
    			if (index != -1)
    			{
    				var poz = parseInt(this.mainUL.css("margin-left"), 10);
    				var startPos = index * self.tabLength;
    				if (-poz > startPos)
    				{
    					this.mainUL.animate({"margin-left": "+=" + (-poz-startPos)}, 500, function() {
    						self.updateScrollButtons();
    					});
    				
    				} else if ((startPos + self.tabLength) > self.container.width() - poz) {
    					this.mainUL.animate({"margin-left": "-=" + (startPos + self.tabLength - self.container.width() + poz + self.tabScroller.width() )}, 500, function() {
    						self.updateScrollButtons();
    					});
    				
    				}
    			
    			}
    		}
    	}
    	
    	this.addTab = function(newTab, setActive) {
    
    		if (this.indexOfByID(newTab.id) == -1)
    		{
    			this.items.push(newTab);
    			
    			newTab.html = $("<li></li>").css("width", self.tabWidth + "px").addClass("tabItem");
                if (newTab.hint == null)
                    newTab.hint = newTab.title;
                var titleSpan = $('<span></span>').addClass("tabTitle").text(newTab.title).attr('title', newTab.hint).css("width", self.tabWidth + "px");
                if (newTab.icon)
                {
                    newTab.html.append($("<img class='tabItemIcon' src='" + newTab.icon + "' />"));
                    titleSpan.css("padding-left", "20px").css("width", (self.tabWidth - 20) + "px");
                }
                if (settings.showCloseButton)
                {
    			    $('<a class="tabItemCloseButton" title="Close tab"></a>').appendTo(newTab.html).click(function(event) {
        				self.closeTab(newTab);
        			});
                    titleSpan.css("width", (parseInt(titleSpan.css("width")) - 20) + "px");
                }
                newTab.html.append(titleSpan);

                if (newTab.active)
    				newTab.html.addClass("tabItem-active");
    			newTab.html.appendTo(this.mainUL);
				newTab.html.data("tab", newTab);

                newTab.html.bind("mouseup", function() {
    				self.setActive(newTab);
    			});
                
    			
    			if (setActive == true)
    				this.setActive(newTab);
    				
    			this.updateScrollButtons();
    		} else {
    			var tab = this.items[this.indexOfByID(newTab.id)];
    			this.setActive(tab);
    		}
    	}
        
        this.setActive = function(tab) {
    		var oldTab = this.selectedTab;
    		if (oldTab != null && oldTab == tab) return;
    		
    		if (this.indexOf(tab) == -1) return;
    		
            if (settings.onchangeable == null || settings.onchangeable(oldTab, tab))
            {
        		tab.active = true;
        		this.selectedTab = tab;
        		$.each(self.items, function(i, item) {
        			if (item == tab)
        			{
            			item.html.addClass("tabItem-active");
                        if(settings.onchanged != null)
                            settings.onchanged(oldTab, tab);
        				self.moveScrollToActiveTab();
        			}
        			else
        			{
        				item.active = false;
        				item.html.removeClass("tabItem-active");
        			}				
        		});
            }
    	}        
    	
    	this.closeTab = function(tab, forced) {
            if (typeof(tab) == "int")
                tab = self.indexOf(tab);
    		if (forced || ((tab != null) && (settings.onclosable == null || settings.onclosable(tab)))) {
    			if (this.selectedTab == tab)
    				this.selectedTab = null;
				tab.html.remove();
        		var index = this.indexOf(tab);
    			this.RemoveFromArray(this.items, tab);

                if (this.items.length > index)
    				this.setActive(this.items[index]);
    			else if (this.items.length > 0)
    				this.setActive(this.items[this.items.length - 1]);
    			
    			this.updateScrollButtons();
                if (settings.onclosed)
                    settings.onclosed(tab);
    		}
    	}
    	
    	this.indexOfByID = function(id) {
    		var index = -1;
    		$.each(this.items, function(i, item) {
    			if (item.id != null && id != null && (item.id == id))
    			{
    				index = i;
    				return false;
    			}
    		});
    		return index;
    	}
    
    	this.indexOf = function(tab) {
    		var index = -1;
    		$.each(this.items, function(i, item) {
    			if (item == tab)
    			{
    				index = i;
    				return false;
    			}
    		});
    		return index;
    	}
    	
    	this.getTab = function(onCheck) {
    		var res = null;
    		$.each(this.items, function(i, item) {
    			if (onCheck(item))
    			{
    				res = item;
    				return false;
    			}
    		});
    		return res;
    	}
    
    	
    	this.getTabByID = function(id) {
    		var index = this.indexOfByID(id);
    		if (index != -1)
    			return this.items[index];
    		else
    			return null;
    	}
    
	
    	this.closeAllTabs = function(force, exceptTab) {
			var tempList = [];
    		$.each(this.items, function(i, tab) {
				if (exceptTab == null || exceptTab != tab)
					tempList.push(tab);
    		});
    		$.each(tempList, function(i, tab) {
    			self.closeTab(tab, force);
    		});
    	}
    	
        this.RemoveFromArray = function(array, obj)
        {
            var index = $.inArray(obj, array);
        	if (index >= 0)
        		array.remove(index);	
        }  
        
        if (settings.tabs.length > 0)
        {
            $.each(settings.tabs, function(i, item) {
                self.addTab(item);
            });
            
        }
    }
    
}(jQuery));

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};