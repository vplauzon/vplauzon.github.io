---
title: SOA vs Mobile APIs
date: 2015-08-02 19:00:26 -04:00
permalink: /2015/08/02/soa-vs-mobile-apis/
categories:
- Solution
tags:
- API
---
I recently read an article from <a href="http://blog.dreamfactory.com/author/bill-appleton" target="_blank">Bill Appleton</a> of <a href="http://www.dreamfactory.com/" target="_blank">Dream Factory</a> with the provocative title <a href="http://blog.dreamfactory.com/soa-is-not-a-mobile-backend" target="_blank">SOA is not a Mobile Backend</a>.

It raised quite a few good points that were in the back of my mind for more than a year.

<strong>Basically, what is the difference between SOA and API</strong>?

<a href="/assets/2015/8/soa-vs-mobile-apis/inclusion-229302_6401.png"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="inclusion-229302_640[1]" src="/assets/2015/8/soa-vs-mobile-apis/inclusion-229302_6401_thumb.png" alt="inclusion-229302_640[1]" width="189" height="168" align="right" border="0" /></a>To an extent it is largely the domain of the buzzword department but as you think about it, it is more profound.

SOA really is an Enterprise Creature.  It’s a system integration strategy (despite what SOA purist will tell you).  As Bill mentions in his article, SOA also typically comes with its heavy Enterprise artillery:  Enterprise Service Bus, XML Message Translation, Service Locator, etc.  .  But it also comes with a set of useful practices:  domain knowledge, reusable services, etc.  .

API is an internet beast.  How do you interact with a service on the cloud?  You talk to its API.  API are typically simpler in terms of protocols:  HTTP, REST, JSON, simple messages, etc.  .  They are also messy:  is an API about manipulating a specific entity or doing a consisting set of functionalities?

To me, they spawn from the same principles, i.e. standard interface to exchange information / commands in a loosely couple way between remote components.  SOA is the Enterprise &amp; earlier result of those principles.  API is the internet / mobile later result.

SOA was tried by some big enterprises, forged by comity with expensive consultants and executives trying to solve the next 10 years problem.

<a href="/assets/2015/8/soa-vs-mobile-apis/integration_logo1.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="Integration_logo[1]" src="/assets/2015/8/soa-vs-mobile-apis/integration_logo1_thumb.jpg" alt="Integration_logo[1]" width="368" height="324" align="left" border="0" /></a>API was put forward by a myriad of small companies and consumed by even more entities.  They figured out the simplest way to expose / consume services quickly and learned from each other.  In a few years a few set of practices were <a href="http://apievangelist.com/" target="_blank">observed and documented</a> and <a href="http://vincentlauzon.com/2014/12/23/description-of-your-rest-api/">standards are even emerging</a>.

Bill, in his article, contrasts the approaches in a way that reminds me of the old <a href="http://vincentlauzon.com/2011/11/29/applied-soa-part-3-service-discovery-process/">SOA debate of top-bottom vs bottom-top approaches</a>, that is, do you discover your services by laying down your business processes and drilling down discover a need for services or by looking at your applications and which services they expose and hope that one day you can reuse them?

There is a lot of that in the issues brought by Bill around APIs.  Like in SOA if you just spawn new APIs ‘On demand’, you’ll end up with a weird mosaic with overlapping concepts or functionalities.  I agree that practices developed from SOA can definitely helped.  <a href="http://vincentlauzon.com/2011/12/09/applied-soa-part-4-service-taxonomy/">Service Taxonomy</a>, for instance, forces you to think of how your services will align and where their boundaries will be drawn before you start.

But for an organization, I believe it is nearly a forced therapy to implement one or two APIs, experiment them in full operation before you can start having serious discussion around <a href="http://vincentlauzon.com/2013/11/01/applied-soa-series/">other SOA aspects</a>.  Once you’ve tried it, you can have a much more informed discussion about what changes and at which in a service (while discussing <a href="http://vincentlauzon.wordpress.com/2012/05/08/applied-soa-part-9service-versioning/">versioning</a>), what type of <a href="http://vincentlauzon.wordpress.com/2012/02/09/applied-soa-part-8security/">security rules</a> make sense and a bunch of other aspects.

Otherwise you fall victim of the good old <a href="https://en.wikipedia.org/wiki/Analysis_paralysis" target="_blank">analysis paralysis</a> and will host meetings after meetings for deciding about something because everyone has a different a priori perspective on it.

&nbsp;

So my suggestion is yes, API are a little messier, but experimenting with them, even if you end up with a lot of rework, will bring much value to your organization.  So go, and create simple API, expose them and operate them!