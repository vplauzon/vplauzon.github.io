---
title:  Azure Data Factory Editor (ADF Editor)
date:  2015-06-25 19:40:47 -04:00
permalink:  "/2015/06/25/azure-data-factory-editor-adf-editor/"
categories:
- Solution
tags:
- Data
- Integration
---
<a href="http://azure.microsoft.com/en-us/services/data-factory/" target="_blank">Azure Data Factory</a> is still in preview but obviously has a committed team behind it.

<img class="  wp-image-820 aligncenter" src="/assets/2015/6/azure-data-factory-editor-adf-editor/networking1.jpg?w=300" alt="networking[1]" width="427" height="320" />

When I looked at the Service when the preview was made available in last Novembre, the first thing that stroke me was the lack of editor, of designing surface.  Instead, you had to configure your factory entirely in JSON.  You could visualize the resulting factory in a graphical format, but the entry mode was JSON.

Now don't get me wrong.  I love JSON as the next guy but it's not exactly intuitive when you do not know a service and as the service was nascent, the document was pretty slim.

Obviously Microsoft was aware of that since a few months after, they released a <a href="http://azure.microsoft.com/blog/2015/03/02/azure-data-factory-editor-a-light-weight-web-editor/" target="_blank">light-weight web editor</a>.  It is a stepping stone in the right direction.  You still have to type a lot of JSON and there are no, but the tool provides templates and offers you some structure to package the different objects you use.

It isn't a real design surface yet, but it's getting there.

I actually find this approach quite good.  Get the back-end out there first, get the early adopters to toy with it, provide feedback, improve the back-end, iterate.  This way by the time the service team develop a real designer, the back-end will be stable.  In the mean time the service team can be quite nimble with the back-end, avoiding to take decision such as "let's keep that not-so-good-feature because it has too many ramifications in the editor to change at this point".

I still haven't played much with ADF given I didn't need it.  Or actually, I could have used it on a project to process nightly data but it wasn't straightforward given the samples at launch time and the project was too high visibility and had too many political problems to add an R&amp;D edge to it.  Since then, I am looking at the service with interest and can't wait for tooling to democratize its usage!