---
title:  REST style with Hypermedia APIs
date:  2013-11-11 21:44:01 -05:00
permalink:  "/2013/11/11/rest-style-with-hypermedia-apis/"
categories:
- Solution
tags:
- API
---
Once upon a time there was <a href="http://en.wikipedia.org/wiki/SOAP">SOAP</a>. SOAP really was a multi-vendor response to CORBA. It even share the same type of acronym, derived from <em>object</em>. <em>Objects </em>are so 90's dude… The S in SOAP stands for <em>Simple</em> by the way. Have a go at a bare <a href="http://en.wikipedia.org/wiki/Web_Services_Description_Language">WSDL</a> and try to repeat in your head that it is simple…

Then <a href="http://en.wikipedia.org/wiki/Representational_State_Transfer">REST</a> came along. I remember reading about REST back in 2002. It was a little after <a title="Roy Fielding" href="http://en.wikipedia.org/wiki/Roy_Fielding">Roy Fielding</a>'s seminal article (actually his PhD thesis). Then there were a few articles about how SOAP bastardized the web and how <a href="http://en.wikipedia.org/wiki/XML_RPC">XML RPC</a> was so much better. But like the VHS vs Betamax battle before, the winner wasn't going to be chosen on technical prowess. At least not at the beginning.

Then I stopped hearing about REST in 2003 and started seeing SOAP everywhere. We implemented it like COM+ interfaces really. A classic in the .NET community was to through Datasets on the wire via SOAP services. That really was a great way to misuse a technology… Ah… the youth… (a tear).

Microsoft tried to correct the trajectory by introducing WCF which enforced, or at least strongly suggest, a more SOA approach with a stronger focus on contracts and making boundaries more explicit. But somehow it was too late… something else was brewing beneath the SOA world…

In 2007, REST came back into fashion but now it was mainstream, i.e. people didn't understand it, misquote it and threw it everywhere. Basically, it was: cool man, no more bloody contracts, I just send you an XML document, it's so much simpler! Which of course works awesomely for 2-3 operations, then you start to get lost without a service repository because there are no explicit documentation!

If you see a parallel with the No-SQL movement (cool man, no more bloody schema, I just throw data in a can without ceremony, it's so much simpler), I got no idea what you are talking about.

Anyway, if it wasn't obvious, I'm not at all convinced that REST services solve that many issues by themselves. Ok, they don't require a SOAP stack which make them appealing for a broader reach (read browser &amp; mobile). But without the proverbial Word document next to you to know which service to call and to do something with, they aren't that easy to use.

Then, finally, came Hypermedia API… I've a few articles about those, including the very good <a href="http://www.infoq.com/articles/hypermedia-api-tutorial-part-one">Designing and Implementing Hypermedia APIs</a> by <a href="http://www.amundsen.com/">Mike Amundsen</a>. I found in Hypermedia APIs the same magic I found when looking at HTML the first time: simple, intuitive &amp; useful.

Hypermedia APIs are basically REST Web Services where you have one (or few) entry doors operations and from which you can find links to other operations. For instance, a list operation would return a list of items and each item would contain a URL pointing to the detail of the item. Sounds familiar? That's how a portal (or dashboard) work in HTML.

Actually, you already know the best Hypermedia API there is: <a href="http://www.odata.org/">OData</a>. With OData, you group many entities under a service. The root operation returns you a list of entities with a URL to an operation listing the instances of those entities.

The magic with Hypermedia APIs is that you just need to know your entry points and then the service becomes self-documented. It replaces a meta data entry (a la WSDL) with the service content itself.

The difference between now and the 2000's when SOAP was developed is that now we really do need Services. We need them to integrate different systems within and across companies.

SOAP failed to deliver because of its complexity but mostly because it's a nightmare to interoperate (ever tried to get a <em>System.DateTime</em> .NET type into a Java system? Sounds trivial, doesn't it?).

REST seems easier on the surface because it's just XML (or JSON). But you do lose a lot. The meta-data but also the WS-* protocols. Ok it was nearly impossible to interoperate with those but at least there was a willingness, a push, to standardise on things such as security &amp; transactions. With REST, you're on your own. You want atomicity between many operations? No worries, I'll bake that into my services! It won't look like any else you've ever seen or are likely to see though.

Mostly, you lose the map. You lose the ability to say 'Add Web Reference' and have your favorite IDE pump the metadata and generate nice strongly type proxies that will show up in intellisense as you interact with the proxy. Sounds like a gadget but how much is Intellisense responsible for the discovery of APIs for you? For me, it must be above %80.

Hypermedia API won't give you Intellisense, but it will guide you in how to use the API. If you use it in your designs, you'll also quickly find out that it will drive you to standardise on representations.