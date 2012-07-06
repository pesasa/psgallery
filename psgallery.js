/*********************************************************
 * psgallery.js
 * jQuery-plugin for creating an image gallery
 * Petri Salmela
 * pesasa@iki.fi
 * 06.07.2012
 *
 * License: GNU Lesser General Public License (LGPL)
 *    http://www.gnu.org/licenses/lgpl.html
 ********************************************************/


(function($){
    // jQuery plugin
    $.fn.psgallery = function(options){
        // Extend default settings with user given options.
        var settings = $.extend({
            style: "psg_default",       // html class for styling
            tnmatch: /(\.[^\.]+)$/,     // RegExp (or string) to match for thumbnailing
            tnreplace: "-tn$1",         // Replace matched with this to get thumbnail url.
            tnadd: '',                  // String to add before '.extension' to get thumbnail url.
                                        // If this is used, tnmatch and tnreplace are not.
            notn: false,                // If true, the image itself is used as thumbnail.
                                        // Not recommended, since using big image as thumbnail is heavy!
            tnmaxsize: 200,             // Maximum size (x or y) of thumbnails.
            tnmaxheight: 200,           // Maximum y-size of thumbnails.
            tnmaxwidth: 200,            // Maximum x-size of thumbnails.
            circular: true,             // If true, the first image is next from last.
            fullscreen: false,          // If true, view-mode defaults for fullscreen.
            fadespeed: 200              // Speed of fade effect in image change.
        }, options);
        settings.tnmaxheight = Math.min(settings.tnmaxheight, settings.tnmaxsize);
        settings.tnmaxwidth = Math.min(settings.tnmaxwidth, settings.tnmaxsize);
        // Return this so that methods of jQuery element can be chained.
        return this.each(function(){
            // Create new Psgallery object.
            var gallery = new Psgallery(this, settings);
            // Init the gallery.
            gallery.init();
        });
    }
    
    Psgallery = function(place, settings){
        // Constructor for Psgallery object.
        var imagetypes = ['jpg','jpeg','png','gif'];
        this.settings = settings;
        this.place = $(place);
        this.place.addClass('psgallery');
        var liitems = this.place.find('li');
        this.addCss();
        this.items = [];
        for (var i = 0; i < liitems.length; i++){
            var href = liitems.eq(i).find('a').attr('href') || '';
            var caption = liitems.eq(i).find('a').html();
            var extension = href.split('.').pop().toLowerCase();
            if (imagetypes.indexOf(extension) != -1){
                var picitem = {
                    litem: liitems.eq(i),
                    href: href,
                    thumbnail: href.replace(this.settings.tnmatch, this.settings.tnreplace),
                    caption: caption
                };
                if (!!this.settings.tnadd){
                    picitem.thumbnail = href.replace(/(\.[^\.]+)$/, this.settings.tnadd + '$1');
                }
                if (this.settings.notn){
                    picitem.thumbnail = href;
                }
                this.items.push(picitem);
            }
        }
    }

    Psgallery.prototype.addCss = function(){
        if ($('head style#psg_style').length == 0){
            var rules = '';
            for (var i = 0; i < Psgallery.css.length; i++){
                rules += Psgallery.css[i].selector + ' {' + Psgallery.css[i].rules + '}\n';
            }
            $('head').append('<style type="text/css">\n' + rules + '</style>\n');
        }
    }
    
    Psgallery.prototype.init = function(){
        var gallery = this;
        if (this.place.hasClass('psg_gallerified')){
            return false;
        }
        this.place.addClass('psg_gallerified').addClass(this.settings.style);
        for (var i = 0; i < this.items.length; i++){
            var imagename = this.items[i].href.split('/').pop() || '';
            var edata = {index: i};
            var link = this.items[i].litem.find('a').eq(0);
            link.empty()
                .append('<img src="'+this.items[i].thumbnail+'" alt="'+imagename+'" title="'+this.items[i].caption+'" class="psg_thumbnail" style="max-width:'+this.settings.tnmaxwidth+'px;max-height:'+this.settings.tnmaxheight+'px;" />')
                .click(edata, function(e){
                    gallery.show(e.data.index);
                    e.preventDefault();
                    e.stopPropagation();
                });
        }
    }
    
    Psgallery.prototype.show = function(index){
        this.index = index;
        this.wrapper = this.place.next();
        var isopen = (this.wrapper.hasClass('psgimage_wrapper'));
        var gallery = this;
        if (!isopen){
            this.place.after('<div class="psgimage_wrapper '+this.settings.style+'"><div class="psgimage_container"></div></div>');
            this.wrapper = this.place.next();
        }
        if (this.settings.fullscreen){
            this.wrapper.addClass('psg_fullscreen');
        }
        this.container = this.wrapper.find('.psgimage_container');
        this.container.append('<div class="psgallery_imagewrapper"></div>');
        this.container.append('<div class="psgallery_captionwrapper"><span class="psgallery_kofn"></span><div class="psgallery_caption"></div></div>');
        this.container.append('<div class="psgallery_toolwrapper"></div>');
        this.image = this.container.find('.psgallery_imagewrapper');
        this.kofn = this.container.find('.psgallery_captionwrapper .psgallery_kofn');
        this.caption = this.container.find('.psgallery_captionwrapper .psgallery_caption');
        this.tools = this.container.find('.psgallery_toolwrapper');
        this.tools.append('<a href="javascript:;" class="psgallery_previous"><span>&#9664;</span></a>');
        this.tools.append('<a href="javascript:;" class="psgallery_next"><span>&#9654;</span></a>');
        this.tools.append('<a href="javascript:;" class="psgallery_close"><span>&#x2718;</span></a>');
        this.tools.append('<a href="javascript:;" class="psgallery_fullscreen"><span>&#x21f1;</span></a>');
        this.tools.find('a.psgallery_close').click(function(){
            $(this).parents('.psgimage_container').fadeOut(500, function(){
                gallery.wrapper.remove();
            });
        });
        this.tools.find('a.psgallery_fullscreen').click(function(){
            $(this).parents('.psgimage_wrapper').toggleClass('psg_fullscreen');
        });
        this.tools.find('a.psgallery_previous').click(function(){
            gallery.index = (gallery.index - 1 + gallery.items.length) % gallery.items.length;
            gallery.showImage();
        });
        this.tools.find('a.psgallery_next').click(function(){
            gallery.index = (gallery.index + 1) % gallery.items.length;
            gallery.showImage();
        });
        this.showImage(this.index);
    }
    
    Psgallery.prototype.showImage = function(index){
        if (!!index){
            this.index = index;
        }
        var gallery = this;
        this.tools.removeClass('psg_lastimage').removeClass('psg_firstimage');
        if (this.index == 0 && !this.settings.circular){
            this.tools.addClass('psg_firstimage');
        }
        if (this.index == this.items.length -1 && !this.settings.circular){
            this.tools.addClass('psg_lastimage');
        }
        var imagename = this.items[this.index].href.split('/').pop() || '';
        var imghtml = '<img class="psgimg" src="'+this.items[this.index].href+'" alt="'+imagename+'" title="'+this.items[this.index].caption+'" />';
        this.image.fadeOut(gallery.settings.fadespeed, function(){
            $(this).empty().append(imghtml).fadeIn(gallery.settings.fadespeed);
        });
        this.caption.empty().append(this.items[this.index].caption);
        this.kofn.empty().append((this.index+1) + '/' + this.items.length);
    }
    
    Psgallery.css = [
        {selector: 'ul.psgallery', rules: 'list-style: none; margin: 0.5em; padding: 0; text-align: center; font-family: helvetica,Arial,sans-serif;'},
        {selector: 'ul.psgallery li', rules: 'margin: 0em; padding: 0; display: inline-block; vertical-align: top;'},
        {selector: 'ul.psgallery img.psg_thumbnail', rules: 'width: auto; height: auto;'},
        {selector: '.psgimage_wrapper', rules: 'position: fixed; top: 0; bottom: 0; left: 0; right: 0; background-color: rgba(0,0,0,0.5); text-align: center; z-index: 10; font-family: helvetica,Arial,sans-serif;'},
        {selector: '.psgimage_container', rules: 'position: absolute; top: 3em; bottom: 3em; left: 10em; right: 10em; margin: 0; display: inline-block; padding: 1em 1em 5em 1em; background-color: white; border: 3px solid black; border-radius: 0.5em; box-shadow: 8px 8px 8px rgba(0,0,0,0.5);'},
        {selector: '.psgallery_imagewrapper', rules: 'position: absolute; top: 0.5em; left: 0.5em; right: 0.5em; bottom: 6em;'},
        {selector: '.psgallery_imagewrapper img.psgimg', rules: 'max-height: 100%; max-width: 100%; height: auto; width: auto;'},
        {selector: '.psgallery_captionwrapper', rules: 'margin: 0; padding: 0 0.5em; position: absolute; bottom: 0.5em; left: 0; right: 0; background-color: black; box-shadow: 0 -10px 5px black,0 10px 5px black;'},
        {selector: '.psgallery_caption', rules: 'margin: 0; padding: 0.5em 0.5em 0.5em 4em; border: 1px solid black; border-radius: 0 0.5em 0.5em 0.5em; background-color: #f0f0f0; box-shadow: inset 5px 5px 10px rgba(0,0,0,0.3); height: 3em; overflow: auto;'},
        {selector: '.psgallery_kofn', rules: 'background-color: black; color: white; font-weight: bold; display: inline-block; position: absolute; top: 0; left: 0.5em; border-bottom: 1px solid black; border-right: 1px solid black; box-shadow: 5px 5px 5px rgba(0,0,0,0.3); padding: 0.3em; border-radius: 0 0 0.5em 0;'},
        {selector: 'a.psgallery_previous, a.psgallery_next', rules: 'display: inline-block; margin: 0; padding: 0.7em 1em 1em 1em; font-size: 200%; border: 6px double black; border-radius: 50%; background-color: white; text-decoration: none; font-weight: bold; box-shadow: 5px 5px 5px rgba(0,0,0,0.5); position: absolute; top: 46%; color: black!important; text-align: center; vertical-align: middle; opacity: 0.2; width: 1.5em; height: 1.5em;'},
        {selector: 'a.psgallery_previous', rules: 'left: -1em; padding-left: 0.7em;'},
        {selector: 'a.psgallery_next', rules: 'right: -1em; padding-right: 0.7em;'},
        {selector: '.psg_firstimage a.psgallery_previous', rules: 'display: none;'},
        {selector: '.psg_lastimage a.psgallery_next', rules: 'display: none;'},
        {selector: 'a.psgallery_close', rules: 'display: inline-block; margin: 0; height: 1.4em; width: 1.4em; padding: 0.5em; font-size: 150%; border: 6px double black; border-radius: 50%; background-color: white; text-decoration: none; font-weight: bold; box-shadow: 5px 5px 5px rgba(0,0,0,0.5); position: absolute; top: -1em; right: -1em; color: black!important; text-align: center; vertical-align: middle; text-shadow: 2px 2px 2px #555;'},
        {selector: 'a.psgallery_fullscreen', rules: 'display: inline-block; margin: 0; height: 1.4em; width: 1.4em; padding: 0.5em; font-size: 150%; border: 6px double black; border-radius: 50%; background-color: white; text-decoration: none; font-weight: bold; box-shadow: 5px 5px 5px rgba(0,0,0,0.5); position: absolute; top: -1em; left: -1em; color: black!important; text-align: center; vertical-align: middle; text-shadow: 2px 2px 2px #555;'},
        {selector: 'a.psgallery_next:hover, a.psgallery_previous:hover, a.psgallery_close:hover', rules: 'opacity: 1;'},
        {selector: '.psgimage_container', rules: 'background: rgb(76,76,76); /* Old browsers */\n'
            +'background: -moz-linear-gradient(top,  rgba(76,76,76,1) 0%, rgba(89,89,89,1) 12%, rgba(102,102,102,1) 25%, rgba(71,71,71,1) 39%, rgba(44,44,44,1) 50%, rgba(0,0,0,1) 51%, rgba(17,17,17,1) 60%, rgba(43,43,43,1) 76%, rgba(28,28,28,1) 91%, rgba(19,19,19,1) 100%); /* FF3.6+ */\n'
            +'background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(76,76,76,1)), color-stop(12%,rgba(89,89,89,1)), color-stop(25%,rgba(102,102,102,1)), color-stop(39%,rgba(71,71,71,1)), color-stop(50%,rgba(44,44,44,1)), color-stop(51%,rgba(0,0,0,1)), color-stop(60%,rgba(17,17,17,1)), color-stop(76%,rgba(43,43,43,1)), color-stop(91%,rgba(28,28,28,1)), color-stop(100%,rgba(19,19,19,1))); /* Chrome,Safari4+ */\n'
            +'background: -webkit-linear-gradient(top,  rgba(76,76,76,1) 0%,rgba(89,89,89,1) 12%,rgba(102,102,102,1) 25%,rgba(71,71,71,1) 39%,rgba(44,44,44,1) 50%,rgba(0,0,0,1) 51%,rgba(17,17,17,1) 60%,rgba(43,43,43,1) 76%,rgba(28,28,28,1) 91%,rgba(19,19,19,1) 100%); /* Chrome10+,Safari5.1+ */\n'
            +'background: -o-linear-gradient(top,  rgba(76,76,76,1) 0%,rgba(89,89,89,1) 12%,rgba(102,102,102,1) 25%,rgba(71,71,71,1) 39%,rgba(44,44,44,1) 50%,rgba(0,0,0,1) 51%,rgba(17,17,17,1) 60%,rgba(43,43,43,1) 76%,rgba(28,28,28,1) 91%,rgba(19,19,19,1) 100%); /* Opera 11.10+ */\n'
            +'background: -ms-linear-gradient(top,  rgba(76,76,76,1) 0%,rgba(89,89,89,1) 12%,rgba(102,102,102,1) 25%,rgba(71,71,71,1) 39%,rgba(44,44,44,1) 50%,rgba(0,0,0,1) 51%,rgba(17,17,17,1) 60%,rgba(43,43,43,1) 76%,rgba(28,28,28,1) 91%,rgba(19,19,19,1) 100%); /* IE10+ */\n'
            +'background: linear-gradient(to bottom,  rgba(76,76,76,1) 0%,rgba(89,89,89,1) 12%,rgba(102,102,102,1) 25%,rgba(71,71,71,1) 39%,rgba(44,44,44,1) 50%,rgba(0,0,0,1) 51%,rgba(17,17,17,1) 60%,rgba(43,43,43,1) 76%,rgba(28,28,28,1) 91%,rgba(19,19,19,1) 100%); /* W3C */\n'
            +'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#4c4c4c", endColorstr="#131313",GradientType=0 ); /* IE6-9 */'},
        {selector: '.psgimage_wrapper.psg_fullscreen .psgimage_container', rules: 'top: 0; bottom: 0; left: 0; right: 0; border-radius: 0; box-shadow: none;'},
        {selector: '.psgimage_wrapper.psg_fullscreen .psgallery_captionwrapper', rules: 'opacity: 0;'},
        {selector: '.psgimage_wrapper.psg_fullscreen .psgallery_captionwrapper:hover', rules: 'opacity: 1; background-color: rgba(0,0,0,0.5); box-shadow: 0 -10px 5px rgba(0,0,0,0.5), 0 10px 5px rgba(0,0,0,0.5);'},
        {selector: '.psgimage_wrapper.psg_fullscreen .psgallery_captionwrapper:hover .psgallery_caption', rules: 'opacity: 1; background-color: rgba(255,255,255,0.7); text-shadow: 0 0 5px white;'},
        {selector: '.psgimage_wrapper.psg_fullscreen .psgallery_imagewrapper', rules: 'top: 0; bottom: 0; left: 0; right: 0;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_next', rules: 'right: 0; font-size: 100%;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_previous', rules: 'left: 0; font-size: 100%;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_close', rules: 'right: 0; top: 0; font-size: 80%; opacity: 0.3;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_close:hover', rules: 'opacity: 1;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_fullscreen', rules: 'left: 0; top: 0; font-size: 80%; opacity: 0.3;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_fullscreen:hover', rules: 'opacity: 1;'},
    ];

})(jQuery)
