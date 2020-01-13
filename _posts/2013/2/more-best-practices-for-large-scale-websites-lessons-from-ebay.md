---
title: 'More Best Practices for Large-Scale Websites: Lessons from eBay'
date: 2013-05-21 17:00:15 -07:00
permalink: /2013/05/21/more-best-practices-for-large-scale-websites-lessons-from-ebay/
categories:
- Solution
tags: []
---
Watch <a href="http://www.infoq.com/presentations/Best-Practices-eBay">this presentation</a> from Randy Shoup, distinguished engineer at eBay.

He goes on talking about the lessons learned from his organization to scale a service.

He brings in 10 lessons:
<ul>
	<li>Partition Everything</li>
	<li>Asynchrony Everywhere</li>
	<li>Automate Everything</li>
	<li>Everything Fails</li>
	<li>Embrace Inconsistency</li>
	<li>Expect (R)evolution</li>
	<li>Dependencies Matter</li>
	<li>Respect Authority</li>
	<li>Never Enough Data</li>
	<li>Custom Infrastructure</li>
</ul>
Those are valuable lessons for any scalable cloud deployed services.

Probably the most original aspect of the presentation for me was his discussion about changes in systems. This is a topic rarely discussed because it is complicated and isn't supported natively by different Cloud Platforms: how do you deploy a new version of a service when you need to deploy a new storage (e.g. schema) and processing on that storage.

eBay's solution is that you keep both versions of the storage around and perform what they call <em>dual writing</em>: the systems write on both versions of the storage. They then keep both versions until they are convinced they won't roll back the new service.

Otherwise, very interesting talk full of gems!