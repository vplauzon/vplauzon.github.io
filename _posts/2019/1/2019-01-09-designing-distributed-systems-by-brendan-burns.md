---
title:  Designing Distributed Systems by Brendan Burns
date:  01/09/2019 11:30:31
permalink:  "/2019/01/09/designing-distributed-systems-by-brendan-burns/"
categories:
- Solution
tags:
- Containers
- Integration
---
<img style="float:left;padding-right:20px;" title="From leeroy on www.pexels.com" src="https://vincentlauzon.files.wordpress.com/2018/11/designing-distributed-systems-cover-e1541587756618.png" />

In this article I wanted to talk about a book I just finished reading.

Although its title and scope is around distributed systems in general, Brendan Burns discussion is mostly using containers &amp; Kubernetes.

Brendan Burns is currently (as of this writing in November 2018) at Microsoft.  He is a cofounder of the Kubernetes project.  So he has a few insights about how to use it.

The book is available for free as a PDF at different locations.  For instance <a href="https://azure.microsoft.com/en-us/resources/">Microsoft Resource Center</a> offers it as <a href="https://azure.microsoft.com/en-us/resources/designing-distributed-systems/en-us/">an e-book</a>.

Although the book contains broad discussion, it is structured around patterns.

I'll say what I said after I read the <a href="https://en.wikipedia.org/wiki/Design_Patterns">gang of four Design Patterns book</a> 20 years ago:  even if you're smarter than the rest of us and already knew all this, you should still read it.  Patterns gives us a common vocabulary to discuss architecture.

For instance, I could say that I'm using multi-container pods where one of the containers is kind of proxying calls to the outside world to add some logic.  I would probably get you all confused and would need to explain for minutes what exactly I mean.  Or I could just say my pods are using an <em>Ambassador</em>.

Boom.

That's what patterns do for us.  They elevate the discussion.  We can talk about the solution instead of details which are variation on common themes.

Brendan structures the book in three areas:

<ol>
<li>Single Node Patterns</li>
<li>Serving Patterns (multi-node patterns &amp; micro-services)</li>
<li>Batch Computational Patterns</li>
</ol>

Of course, a lot of patterns are readily implemented by some vendor products (I'm looking at you Batch Computational patterns).  But the same way somebody could have argued in 2009 that most of Fowler's <a href="https://www.enterpriseintegrationpatterns.com/">Enterprise Integration Patterns</a> were already implemented in different EAI platforms, the patterns outlived them all.

Like other patterns book, I feel I will be going back to it.  Great read.