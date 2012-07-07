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

    Psgallery.images = {
        fullscreen_yes: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABHNCSVQICAgI\
fAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3\
Lmlua3NjYXBlLm9yZ5vuPBoAAAFfSURBVDiNzZMxjoMwEEW/V1yAnMMdVGkz\
RZQzcAdKXKAUrqDMHTiD5cJ1KtL5HPgClrzFCivg9Wa1SrG/gmHmzZj5ZvM8\
B7xRH++EAUCxPtR1nXwkIgzDsIkJIWCMSXLnef55wrIs0XVdEu+6DmVZZifM\
AnOFuUYvgdZahJDuK4QAa20WWDy/rN2ttZimCcuy4Hq9oii+0rz3kFJCKYWm\
acA5xziOcM6lQCKKxzydTliWBUopHI9HnM9nAIAxBkopXC4XtG0LxhiqqsI4\
jhHIcj703sMYE2GrtNYgojj1XlngX/V2Y2eB3ntorZO41hre+9dAIUTcVggB\
Ukr0fb+Baq3R9z2klNFSzjkIIWJO/LPGGDwej2ibdZtEFJOJCPf7HUopHA6H\
b20Tl7K/y03TRGs8K4SA2+2GaZo28Zd3mXOewACAMQbOea4sD9wfZZVzbmPk\
XwNzhblGq/6/sT8BBFu16A/9bRMAAAAASUVORK5CYII=",
        fullscreen_no: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABHNCSVQICAgI\
fAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3\
Lmlua3NjYXBlLm9yZ5vuPBoAAAGzSURBVDiNzZKhjqtAFIa/cmsqEFgwTVNX\
u652SKoRtbg6NE0D6U2aJvAONdgKNOnMI9B3qEGPwE64V9wsWZY2e8WK/dXk\
8PPNOXP+SV3Xf/hGWd8JGwGrqsIY898/G2Ooquo5sKoqkiQhTVO6rusNSqmn\
567rSNOUJEkG0B4ohMD3faSUZFkGgNaaPM97c57naK0ByLIMKSW+7yOE6D3T\
/jCdcj6fsW2bsiyxbZumaXrAxws8z6MsS4IgYL/fY1nWGAhgWRaHwwHbtimK\
4um7vY8dhiFRFI2+j7astaZpmqewj/rc/VOgUortdjt4/Fd65Z38+GAPlqKU\
GkTjXXVdA/D29jaoO45DHMeD2Aw6FEJwvV4Hhld65R2N7DgOnud9CfQ8D8dx\
RvXByF3XkWUZZVkShiFN04y2KITA8zyKoqBt29fBNsaQpilSSoIgIIoitNbc\
7/dB93Ec4zgObdtSliVt23I6nZhO/6F+7Xa73wC3243L5YLv+xyPRyaTCbPZ\
DNd1WSwWALiuy2q1AmC9XvN4PJBSMp/PWS6XwKccVlWFEKK/7SsZY1BKsdls\
+trPD/ZfC5rKtftURpAAAAAASUVORK5CYII=",
        close: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgI\
fAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3\
Lmlua3NjYXBlLm9yZ5vuPBoAAALUSURBVFiF7Zc/SONQHMc/6dYWB8HFQZwK\
ohaJSkERUdSlIIi4iCBSsYhuDoog6ODgIEiXdmgHEcWhRbqIg5jBwcFFROpQ\
jX+gFSqK0MFSis0NB+F6vTvzGtRD8t1+//L98Mh7eZGy2azGfyzbVwO8JwvQ\
rCxAs7IAzcoCNKvvBZhKpchms8Imj4+P7O/vk8lkhGcNA+7u7uJ2u3G5XMzN\
zXF7e/vuTCKRYGZmhqamJkZHR+np6eHp6eljAKPRKG9vb+RyOSKRCLIs4/P5\
eHh4KOtNpVIMDQ3R0dHB9vY2+XwegHQ6zd3d3ccAOp3OkrhYLBKLxfB4PGxu\
bqJpPy9FR0dHdHV1oShK2TM6Oztpbm4WApSMXrfi8Tjj4+N/rXd3d9PW1kYg\
EKBYLJbVp6amWF1dxW63fwwgwM7ODktLSzw/Pxs2qK2tJRgM0tfXJwRWESBA\
Pp8nHo8TDoc5PT39Z+/w8DAbGxtUV1dXBFcR4K86Pz9nenqaRCJRVnO5XBwf\
H5e9u6IydVBrmkYymfxj7erqCq/XK3ys/K6KAV9fX/H5fBQKBT3ncDhKdunZ\
2RkDAwPc399/PuD8/DzX19d6LEkS4XCYw8NDent79byqqvT393NxcfF5gAcH\
B2xtbZXkVlZWGBwcxOl0EovFGBkZ0WuZTAav18vNzY2wl/AmKRQKeDweVFXV\
c2NjY4RCoZI+TdNYXFwkGAzqucbGRhRFweFwGPYTXsFIJFIC53a7CQQCZX2S\
JLG2tsbCwoKeu7y8ZHZ2VshPaAVzuRwNDQ28vLwAYLPZUBSF1tbWf85NTEyw\
t7enx+vr6/j9fkOeQiuYTCZ1OAC/3/8uHEAoFKKlpUWPT05ODHsKAdbX11NX\
VwdAe3s7y8vLhubsdjvRaBRZlqmpqWFyctKwp/AmSafTqKqKLMtUVVWJjFYk\
U5+6z9D3+if5ClmAZmUBmpUFaFYWoFn9AOJcFb/0Rj0FAAAAAElFTkSuQmCC",
        previous: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgI\
fAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3\
Lmlua3NjYXBlLm9yZ5vuPBoAAAC1SURBVFiF7djBDcMgEETRcZSyoAEaoyJo\
ACqigeS0B58cM7tgRfvvoCcwWOIYY3zw4F67AVc5kM2BbA5kcyCbAwGgtYaU\
0tTYt7LlVGsNOWf03qfnMAFqwCRVoCZMUgFawCQKaAmTpoArYNIt4EqY9BNw\
B0z6jz9JjBG1VpRSEEKwNp26tYI7oFNbvBJKfYMroCqHxBKqeootoCbXjCbU\
9B7UgB7+eETmQDYHsjmQzYFsjwd+ATl1aeA2ISdgAAAAAElFTkSuQmCC",
        next: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgI\
fAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3\
Lmlua3NjYXBlLm9yZ5vuPBoAAACsSURBVFiF7djBCcQgEIXhSdiytAGtyPq0\
IhtITnML7OKbmZXw/rvkA3WEHHPOSzbu/DfgWwSiEYhGIBqBaO8EllKk925t\
eWwJOMaQWmsIFNriCKjJGfSEml4SD6jLLbaEuo4ZC2jIHESgoYN6Bbr9S/KJ\
/FhKSVprknP+eU0IcAWmuQIRmOYCtIBppkBLmGYC9IBpENATpi0BI2DawZ9H\
YASiEYhGIBqBaNsDb64RVIB1FXqBAAAAAElFTkSuQmCC"
    };
    
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
        {selector: 'a.psgallery_previous, a.psgallery_next', rules: 'display: inline-block; margin: 0; padding: 0; border: 6px double #555; border-radius: 50%; box-shadow: 5px 5px 5px rgba(0,0,0,0.5); position: absolute; top: 46%; color: black!important; opacity: 0.2; width: 40px; height: 40px;'},
        {selector: 'a.psgallery_previous span, a.psgallery_next span', rules: 'display: none;'},
        {selector: 'a.psgallery_previous', rules: 'left: -20px; background: white url('+Psgallery.images.previous+') left top no-repeat'},
        {selector: 'a.psgallery_next', rules: 'right: -20px; background: white url('+Psgallery.images.next+') left top no-repeat'},
        {selector: '.psg_firstimage a.psgallery_previous', rules: 'display: none;'},
        {selector: '.psg_lastimage a.psgallery_next', rules: 'display: none;'},
        {selector: 'a.psgallery_close span', rules: 'display: none;'},
        {selector: 'a.psgallery_close', rules: 'display: inline-block; margin: 0; height: 40px; width: 40px; padding: 0; border: 6px double #555; border-radius: 50%; background: white url('+Psgallery.images.close+') left top no-repeat; box-shadow: 5px 5px 5px rgba(0,0,0,0.5); position: absolute; top: -10px; right: -10px; color: black!important;'},
        {selector: 'a.psgallery_fullscreen span', rules: 'display: none;'},
        {selector: 'a.psgallery_fullscreen', rules: 'display: inline-block; margin: 0; height: 20px; width: 20px; padding: 0; background: white url('+Psgallery.images.fullscreen_yes+') left top no-repeat; border: 1px solid #555; border-radius: 4px; text-decoration: none; box-shadow: 5px 5px 5px rgba(0,0,0,0.5); position: absolute; top: 0; left: 0; color: black!important;'},
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
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_fullscreen', rules: 'left: 0; top: 0; background: white url('+Psgallery.images.fullscreen_no+') left top no-repeat; opacity: 0.3;'},
        {selector: '.psgimage_wrapper.psg_fullscreen a.psgallery_fullscreen:hover', rules: 'opacity: 1;'},
    ];

})(jQuery)
