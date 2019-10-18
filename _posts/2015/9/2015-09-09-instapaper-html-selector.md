---
title:  Instapaper - HTML Selector
date:  09/09/2015 23:00:37
permalink:  "/2015/09/09/instapaper-html-selector/"
categories:
- Solution
tags:  []
---
<a href="https://vincentlauzon.files.wordpress.com/2015/08/ip4-icon-big-e13188718225092.png"><img class=" wp-image-1059 alignright" src="https://vincentlauzon.files.wordpress.com/2015/08/ip4-icon-big-e13188718225092.png?w=300" alt="ip4-icon-big-e1318871822509[2]" width="151" height="151" /></a>I use <a href="https://www.instapaper.com" target="_blank">Instapaper</a> a lot.  I discovered it thanks to <a href="http://www.hanselman.com/blog/TwoMustHaveToolsForAMoreReadableWeb.aspx" target="_blank">Hanselman’s blog</a>.

The only way I found to stay on top of things in technology is to do an aggressive Technology Watch.  I do that by reading hundreds of articles found on the web per week:  blogs, RSS feeds, online magazine, suggestions from LinkedIn &amp; Twitter, name it.

Instapaper helps me manage that volume of reading.  It allows me to take a web page and “read it later”.  Simple concept but a powerful one!

Not only Instapaper keeps a list of web page for me, it trims them, keeping only the content, removing ads and other distractions.
<h3>The Problem</h3>
But like many tools out there, Instapaper isn’t perfect.  It has problems with some pages.  LinkedIn pages are notoriously buggy under it but some other site as well.

For instance, try to insert <a title="https://www.linkedin.com/pulse/evolving-role-chief-data-officer-ofir-shalev" href="https://www.linkedin.com/pulse/evolving-role-chief-data-officer-ofir-shalev">https://www.linkedin.com/pulse/evolving-role-chief-data-officer-ofir-shalev</a> in Instapaper and you’ll see it choke on it!

I asked the technical support if they could fix it and they did for a while…  I don’t know, it might be LinkedIn who changed something in it.

Some other site will get their actual content cut out.

Bottom line, I can’t read some of my articles and it’s driving me mad!
<h3>The Solution</h3>
I’ve developed a very simple web solution that allows you to specify a URL of a page and an x-path expression to find an HTML element within the page.

<a href="assets/2015/9/instapaper-html-selector/image45.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/9/instapaper-html-selector/image_thumb45.png" alt="image" width="787" height="208" border="0" /></a>

For instance, the URL I gave in example and if you dig the HTML of the LinkedIn articles, you’ll find the content is within <em>//div[@class='stream-content']</em> (that means the first div, regardless of its position that has the class <em>stream-content</em>).

<a href="assets/2015/9/instapaper-html-selector/image46.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/9/instapaper-html-selector/image_thumb46.png" alt="image" width="802" height="246" border="0" /></a>

You press select and the system spits out the new URL:  <a title="http://htmlselector.azurewebsites.net/Selecting?url=https%3a%2f%2fwww.linkedin.com%2fpulse%2fevolving-role-chief-data-officer-ofir-shalev&amp;xpath=%2f%2fdiv%5b%40class%3d%27stream-content%27%5d" href="http://htmlselector.azurewebsites.net/Selecting?url=https%3a%2f%2fwww.linkedin.com%2fpulse%2fevolving-role-chief-data-officer-ofir-shalev&amp;xpath=%2f%2fdiv%5b%40class%3d%27stream-content%27%5d">http://htmlselector.azurewebsites.net/Selecting?url=https%3a%2f%2fwww.linkedin.com%2fpulse%2fevolving-role-chief-data-officer-ofir-shalev&amp;xpath=%2f%2fdiv%5b%40class%3d%27stream-content%27%5d</a>.

This URL, if you click it, simply reroutes the call to the URL you specifies, fetch the XPATH and returns only the content of the x-path.

You can then pass that URL to Instapaper and it will work.  Finally!

&nbsp;

I’ve used <a href="http://www.nuget.org/packages/XHTMLr" target="_blank">XHTMLr</a> to implement the x-path query within an HTML document.

&nbsp;

If you think that can be useful, the web site is hosted on Azure as a free web site:  <a href="http://bit.ly/1HBcdON" target="_blank">http://bit.ly/1HBcdON</a>.  Go nuts!