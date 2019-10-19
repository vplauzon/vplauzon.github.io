---
title:  Refactoring Tags in WordPress Blog
date:  2016-10-17 19:00:00 -04:00
permalink:  "/2016/10/17/refactoring-tags-in-wordpress-blog/"
categories:
- Solution
tags:
- API
---
<a href="http://vincentlauzon.files.wordpress.com/2016/10/image.png"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/10/image_thumb.png" alt="image" width="213" height="240" align="left" border="0" /></a>I did refactor the tags of my blog this week end!

I display the tags (as a word cloud) on the right-hand side of my pages.  The tags grew organically since I started blogging in 2010.

As with many things that grow organically, it got out of hand with time.  First the technological space I covered in 2010 isn’t the same today but also, I did tend to add very specific tag (e.g. DocumentDB) and with time I ended up with over 60 tags.

With hundreds of blogs and 60 tags, the WordPress portal (I use WordPress.com for my blog) wasn’t ideal to start doing changes.

So I got my <a href="https://vincentlauzon.com/2015/08/20/nuget-wordpress-rest-api-on-codeplex/">WordPress API .NET SDK</a> out of the mothball <img class="wlEmoticon wlEmoticon-winkingsmile" style="border-style:none;" src="http://vincentlauzon.files.wordpress.com/2016/10/wlemoticon-winkingsmile.png" alt="Winking smile" />  I also updated my “<a href="https://wordpress-client.azurewebsites.net/" target="_blank">portal</a>” (deployed on Azure App Services) to that SDK.  This is probably one of the worst example of an ASP.NET MVC application but surely the ugliest site available out there.  It’s functional, that’s what I can say <img class="wlEmoticon wlEmoticon-winkingsmile" style="border-style:none;" src="http://vincentlauzon.files.wordpress.com/2016/10/wlemoticon-winkingsmile.png" alt="Winking smile" />

In case you want to do something similar on your blog, here is how I did it.
<h2>Approach</h2>
First I define target tags.  I did that by looking at the current list of tags but mostly I just gave myself a direction, i.e. the level of tags I wanted.

I then iterated on the following:
<ul>
 	<li>Look at the tags in WordPress portal, find targets for rename</li>
 	<li>Used the “<a href="https://wordpress-client.azurewebsites.net/ChangePostTag" target="_blank">Change Post Tags</a>” functionality to change tags “en masse” on all the posts</li>
 	<li>Alternatively I used the “<a href="https://wordpress-client.azurewebsites.net/PostTag" target="_blank">Edit Post Tags</a>” functionality to edit the tags in Excel</li>
 	<li>Then use the “<a href="https://wordpress-client.azurewebsites.net/CleanTag" target="_blank">Clean up Tags</a>” to remove tags that had no longer any posts associated to it</li>
</ul>
BTW, each of those functionalities tells you what they are going to do to your posts and ask for your consent before doing it.

After a couple of iterations I got the bulk of my tags cleaned up.

The last thing I did was to define the tags, i.e. add descriptions.  I did that within the WordPress portal.

Hopefully that should make my posts easier to search!