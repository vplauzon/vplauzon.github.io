---
title: PyCon Canada 2019
date: 2019-11-27 03:30:21 -08:00
permalink: /2019/11/27/pycon-canada-2019/
categories:
- Solution
tags: []
---
<img style="float:right;padding-left:20px;" title="PyCon Canada" src="/assets/posts/2019/4/pycon-canada-2019/pycon_logo.png" />

I had the pleasure to attend the PyCon (Python Conference) Canada 2019 in Toronto a weekend ago (November 16-17).

In this article I wanted to give a quick review of the event from my perspective and then describe quickly the talks I went to.

Talks will be put on <a href="https://www.youtube.com/channel/UCclkPrurwUP_ajqi3vDTNDg/videos">Pycon's YouTube channel</a>.  I'll try to edit this article to add them in when they do.

PyCon Canada is a branch of the PyCon conference cycle.  <a href="https://en.wikipedia.org/wiki/Python_Conference#Locations">Find one near you</a>!

<h2>My perspective</h2>

<img style="float:left;padding-right:20px;" title="From Pexels.com" src="/assets/posts/2019/4/pycon-canada-2019/grayscale-photography-of-person-at-the-end-of-tunnel-211816-e1574089536541.jpg" />

Before I talked about my perspective on the conference, I must disclose where I'm coming from since that obviously colours my perspective.

My relationship with Python is a little unusual.

In the early 2000 I needed to learn a scripting language to automate some tasks.  I looked at <a href="https://en.wikipedia.org/wiki/Perl">Perl</a> for a few days and felt sick.  I looked at a new emerging language at the time called <a href="https://en.wikipedia.org/wiki/Ruby_(programming_language)">Ruby</a> which was the antithesis of Perl.  Although it was elegant, it wasn't very ubiquitous back then.  I then found <a href="https://en.wikipedia.org/wiki/Python_(programming_language)">Python</a>.  Python was widespread, had good tooling and...  man was it easy to learn and to do things with it!  I was the biggest fan of its array manipulation system and never understood why it wasn't copy-cat over to other languages.

I stopped using it for close to 15 years until I started again a few years ago.  Now it's the Data Science language and one of the most <a href="https://www.technotification.com/2018/04/popular-programming-languages-2018.html">popular language in the world</a>.

So in a nutshell, although I've known Python for close to 2 decades, I'm far from an expert.  I used it for automation and Data Science only.  Also, I have a huge bias towards Enterprise mindset as those are my customers (i.e. big teams, budget, red tape, regulations &amp; security discussions <a href="https://idioms.thefreedictionary.com/until+the+cows+come+home">until the cows come home</a>).

<h2>Review</h2>

<img style="float:right;padding-left:20px;" title="From Pixabay.com" src="/assets/posts/2019/4/pycon-canada-2019/person-taking-photo-of-chocolate-cupcake-using-smartphone-1853011-e1574096675255.jpg" />

This is a conference around one programming language and its community.

Most people I spoke to were from start-ups or product company.  Everybody I spoke to was either a dev or Data Scientists.

For me those conferences are the opportunity to see what the rest of the world are doing.  It's a great opportunity to <strong>learn</strong>.

The first learning is the breath of application of Python.  Sure Data Science is big.  There was an entire Track / room for that topic.  But people are also using Python for Web Development (e.g. <a href="https://en.wikipedia.org/wiki/Flask_(web_framework)">Flask</a>, <a href="https://en.wikipedia.org/wiki/Django_(web_framework)">Django</a>, <a href="https://en.wikipedia.org/wiki/Bottle_(web_framework)">Bottle</a>, <a href="https://en.wikipedia.org/wiki/Web2py">Web2py</a>, etc.) and bunch of other tasks.  It's used a lot for integration work:  processing files, stitching processes together, etc.  .

Second learning is that Python really has a strong community.  I knew it was an Open Source language and hence is community driven, but the breath of community involvement is impressive.  There are <a href="https://en.wikipedia.org/wiki/PyPy">alternative compilers</a>, meetups &amp; obviously conferences.  There is an entire Python history with its lore packed in the old mailing list.  It's akin its own <em>culture</em>.

A very refreshing aspect of the conference was the diversity of the audience and especially the presence of women.  We're still far from parity, but way closer than I'm used to see.  The penny dropped for me in a talk given by a woman and two women in a row were asking questions.  They of course bring a different perspective and tone.  Being a father of a little girl who's into computers and electronics, I found it especially refreshing!

There was little content specific to Enterprises.  It's not a real minus, it's just that I'm so used to have sessions dedicated on team scaling or security issues that I couldn't help noticing it.

The negative point I found was the amount of talks that were side shows to Python.  There was a bunch of talks about Kubernetes, GitOps, DevOps, scale-out architecture, etc.  .  All hot topics nowadays, but that's not really why I went to a Python conference.  It might reveal the limitation of doing an entire conference on a specific language.

Otherwise, the vibe was good, organizers were energetic, and no jerk was encountered, which is always a plus!  It's a small conference.  400 people?  I don't know really but it felt about that, maybe a little less?

<h2>Talks</h2>

The schedule of the talks is available online for <a href="https://2019.pycon.ca/schedule-day-1/">day 1</a> and <a href="https://2019.pycon.ca/schedule-day-2/">day 2</a>.

There were 4 rooms, so I attended to a little more than %25 of the talks (the Key Notes were all together).  I'll only lists the ones I found interesting.  As mentioned above, I'll add video links once they get released.

<h3>Opening Keynote</h3>

By Ideshini Naidoo from <a href="https://www.waveapps.com/">Wave</a>.

That was your typical digital transformation speech with a specific bend on Data / AI centric companies.

The speaker was strongly pushing for a reactive system architecture (a la Event Sourcing).

<strong>Interesting ideas</strong>:  In order to become a Data / AI centric company, you need a Data Ecosystem where your data is easily accessible (democratize access).  I see a lot of companies struggling between that and security.

<h3>Debugging Jupyter Notebook</h3>

By Maria Khalusova from <a href="https://www.jetbrains.com/">Jetbrains</a> (company behind <a href="https://en.wikipedia.org/wiki/PyCharm">PyCharm</a>, a popular Python IDE).

Down to Earth talk about debugging with bunch of useful techniques (e.g. <code>%Xmode magic</code>, <code>%Debug magic</code>, <code>Breakpoint()</code>, etc.).

<strong>Interesting ideas</strong>:  Maria is hosting the <a href="https://www.meetup.com/PyData-MTL/">PyData meetup in Montreal</a> (my home town)!

<h3>Move fast, and break things, deploying Python largest Python site in the world</h3>

By Alvaro Leiva from Instagram.

That's an example of a talk having nothing to do with Python itself.  The site the speaker talked about happened to be written in Python, but there was nothing Python specific about the talk.

That being said...  DevOps is of interest to me, so yes, I enjoyed it.

Instagram apparently deploy every 7 minutes in average, which is definitely extreme.

They do not deploy at the of sprints.  They tried it but with the scale of changes they were doing it wasn't working:

<ul>
<li>You can't really rollback because of DB incompatibility</li>
<li>So you push a hotfix</li>
<li>If you must deploy in mid-sprint (ASAP), you need to cherry pick between your release and Master branch</li>
<li>Sometimes you don't understand the broken code</li>
<li>Client doesn't like what they see after deployment</li>
<li>Sometimes people who introduced changes left the company by the time it's pushed to production</li>
</ul>

For those reasons they use a much more agile approach where they deploy when a feature is ready with the following process:

<ol>
<li>Unit-tests</li>
<li>Canary tests</li>
<li>Canary tests with %2 coverage</li>
<li>Full (%100) coverage</li>
</ol>

That cycle takes around an hour (yes, they sometimes batch changes).  They expect engineers to be around when their changes are pushed to production.

They do not have a branching system:  they develop on Master and deploy the commits.

Culturally they encourage engineers to break AND fix things.  They empower them to do so.

Why they need to introduce so many changes so quickly on a mature product remains unanswered questions.

<strong>Interesting ideas</strong>:  Instagram is the biggest Python site in the world.

<h3>Visualization with Altair</h3>

By Stephen Childs from <a href="https://www.yorku.ca/">York University</a>.

<a href="https://altair-viz.github.io/">Altair</a> is a declarative statistical visualization library for Python, based on <a href="http://vega.github.io/vega">Vega</a> and <a href="http://vega.github.io/vega-lite">Vega-Lite</a>, and the source is available on <a href="http://github.com/altair-viz/altair">GitHub</a>.

Part of its strength is that the interactivity is client-side.

<strong>Interesting ideas</strong>:  It is based on <a href="https://www.goodreads.com/book/show/2549408.The_Grammar_of_Graphics">Grammar of Graphics</a>, a seminal book on visualization.

<h3>From hot mess to information</h3>

By Serena Peruzzo from <a href="http://www.bardess.com/">Bardess</a>.

Practical talk on Data Cleaning to obtain <a href="https://en.wikipedia.org/wiki/Data_quality">Data Quality</a>.  She actually gave a 5-6 steps process.

<strong>Interesting ideas</strong>:  Finally somebody is practical about the reality that <a href="https://www.infoworld.com/article/3228245/the-80-20-data-science-dilemma.html">%80+ of Data Science is Data Cleaning</a>!

<h3>RenPy for narrative video games</h3>

By Susan Chang.

Interesting introduction to narrative video games and the platforms powering them.

<h3>Day 1 closing Keynote</h3>

By Huda Idrees, founder of <a href="https://www.dothealth.ca/">Dot Health</a>.

The tile was <em>Small but Mighty:  a guide to building tiny teams to solve big challenges</em>.  Entrepreneur talk.

Huda told the story of her journey to build a start-up in the Health industry in Canada.

Her company is only 20 people.  She drew comparison to the early GitHub, WhatsApp, Uber Diner, etc.  , companies with small head counts which have disrupted their industry.

Because of their small size, they can move very quickly.

<h3>Day 2 KeyNote</h3>

By Francoise Provencher from Shopify.

<strong>Interesting ideas</strong>:  She used data, on paper (because the last thing you bring at the doctor is your computer), to monitor difficulties with unborn twins.

<h3>Lighting talks</h3>

<strong>Interesting ideas</strong>:  <a href="https://pypi.org/project/gazpacho/">Gazpacho soup Python library</a> for web scraping.

<h3>Operator overloading</h3>

By Greg Ward.

This was an unapologetic rant against abuse with operator overloading in Python (and other languages).  It was very funny.

The speaker started by comparing history of C, C++ &amp; Python:

<ul>
<li>Operators in C (e.g. <code>i++</code>) are fast, bounded &amp; predictable</li>
<li>Operators in Python are predictable</li>
</ul>

Long story short, this is how they should remain.

<h3>Fun with compilers</h3>

By Peter McCormick.

Again, a topic found to my heart:  compilers!

The speaker went into an overview of what a compiler does in general and then dove into how Python's interpreter (CPython) is implemented.

<strong>Interesting ideas</strong>:  <a href="https://en.wikipedia.org/wiki/PyPy">Pypy</a> is a just in time (JIT) Python compiler written in Python.

<h3>Last Keynote</h3>

By William Lachance from Mozilla.

The speaker presented <a href="https://github.com/iodide-project/">Iodide</a>, a product developed by Mozilla Dev with Open Source contribution.

Iodide has the ambition to be a better <a href="https://en.wikipedia.org/wiki/Project_Jupyter#Jupyter_Notebook">Jupyter Notebook</a> by putting the computation on the client side.  This would simplify the setup of Jupyter notebook.

They are leveraging <a href="https://en.wikipedia.org/wiki/WebAssembly">Web Assembly</a> to emulate Python in the browser, similarly to <a href="https://en.wikipedia.org/wiki/Blazor">Blazor</a> with .NET Fx.

<strong>Interesting ideas</strong>:  <a href="https://glitch.com/">Glitch</a> as an inspiration to democratize Data Science.

<h3>A Day In The Life Of A Corporate Data Science Platform</h3>

By Lucas Durand from TD Bank.

The speaker quickly demo how we could instrument notebooks to log cell activities.  He then used those logs to learn about a Data Scientist activities.

Although this was a simple example, it led to a great discussion about how to do <em>Data Driven DevOps</em>.

<strong>Interesting ideas</strong>:  <em>Data Driven DevOps</em> ; using data to understand what your users are doing and what they need / will need before they ask.

<h2>Summary</h2>

So, quite a few talks!

For me a couple of good eye opener on a community I knew little about.

I hope this post give you a roadmap on videos to watch.