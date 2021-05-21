---
title: What is Statistics and why should you care?
date: 2016-04-13 14:13:12 -07:00
permalink: /2016/04/13/what-is-statistics-and-why-should-you-care/
categories:
- Solution
tags:
- Data
- Machine Learning
- Mathematics
use_math: true
---
<img style="background-image:none;float:left;padding-top:0;padding-left:0;margin:0 14px 0 0;display:inline;padding-right:0;border-width:0;" src="http://icons.iconarchive.com/icons/visualpharm/finance/128/line-chart-icon.png" alt="" align="left" border="0" />Unless you graduated in art, chances are you did a course in Statistics.

Chances are you hated it.

Most people I know postponed that course until the end of their degree, didn’t understand much about it and hated it dearly.

I didn’t like it either and understood very little.

A few years later when I studied Machine Learning, I had to review Statistics on my own.  This is when I had the epiphany:  <em>Wow!  This is actually not so complicated and can even be quite interesting</em>!

There are two main reasons I hated my undergraduate course:
<ul>
 	<li>Examples were all around surveys:  I was studying physics at the time, I didn’t care about those</li>
 	<li>It was really geared towards a collection of recipes:  I love mathematics, elegant theories and understanding what I do, cheat sheets didn’t do it for me</li>
</ul>
I would like to share my epiphany from back then with you today.  Hopefully it will shade some light on the poorly understood topic of statistics.

This won’t be a deep dive in the science of statistics.  I want to explain what statistics is by capturing where it comes from and giving very simple examples.  I won’t make statisticians out of you today.  Sorry.
<h2>Layer Cake</h2>
I see statistics as a layer cake.  At the foundation we have combinatorics, then probability and finally at the top, we have statistics.

<a href="/assets/posts/2016/2/what-is-statistics-and-why-should-you-care/image1.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/2/what-is-statistics-and-why-should-you-care/image_thumb1.png" alt="image" width="240" height="185" border="0" /></a>

There lies one of the mistake, in my own opinion, of most statistics course:  they try to get statistics into your head without explaining the two colossus of science it is based on.

Try to explain calculus to somebody who has never seen <em>f(x) = mx + b</em> in 5 minutes and you won’t enlighten them either.

So let’s walk the layer cake from the bottom to the top.
<h2>Combinatorics</h2>
<a href="https://en.wikipedia.org/wiki/Combinatorics" target="_blank"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="https://static.pexels.com/photos/19677/pexels-photo.jpg" alt="" width="448" height="480" align="right" border="0" />Combinatorics</a>:  <em>branch of mathematics studying finite or countable discrete structures</em> (Wikipedia).

Combinatorics is about counting stuff.  Counting elements in sets (cardinality) and then combining sets together.

You’ve done combinatorics, but you don’t remember, do you?  Let me jog your memory.

Ok, let’s say I have the set A = {1, 2, 3}.  How many pairs can I do with elements of A?  How many trios?  What if order is irrelevant and I just want to know the possible distinct pairs?

Yes, you’ve done that type of problems.  This is where you’ve learned a new meaning for the exclamation mark, i.e. the <a href="https://en.wikipedia.org/wiki/Factorial" target="_blank">factorial</a>:  n! = n x (n-1)! (with 0! = 1).

Let’s start an example I’ll carry over in the rest of the article.  Let’s say I have a die with six faces.  The set of possible outcome if I throw it is D = {1, 2, 3, 4, 5, 6}.

How many elements in D?  Six.  Not too hard?  Well, the point isn’t to be hard here.

You can get into quite complicated problems in combinatorics.  I remember an exam question where we had drawers filled with infinite amount of marbles having different colours and we had to mix them together…  that was quite fun.

A good example is the <a href="https://en.wikipedia.org/wiki/Rubik%27s_Cube" target="_blank">Rubik's cube</a> (from the Hungarian mathematician <a href="https://en.wikipedia.org/wiki/Ern%C5%91_Rubik" target="_blank">Ernő Rubik</a>).  A Rubik cube has 6 faces, each having 9 squares.  6 colours, with 9 squares of each colours, 36 squares in total.  What is the number of possible configurations?  Are some configuration impossible given the physical constraints of the cube?
<h2>Probability</h2>
<img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="http://icons.iconarchive.com/icons/designcontest/casino/96/Slots-icon.png" alt="" align="left" border="0" />

<a href="https://en.wikipedia.org/wiki/Probability" target="_blank">Probability</a>:  <em>measure of the likelihood that an event will occur.  Probability is quantified as a number between 0 and 1 where 0 indicates impossibility and 1 indicates certainty</em>. (Wikipedia)

The canonical example is the toss of a coin.  Head is 1/2 ; tail also is 1/2.

What is an event?  An event is an element of the set of all possible event.  An event occurrence is random.

A special category of event is of great interest:  <a href="https://en.wikipedia.org/wiki/Equiprobability" target="_blank">equipossible events</a>.  Those are events which all have the same chance of occurence.  My coin tossing is like that.  So is my 6-faced die…  if it hasn’t been tempered with.

For those, we have a direct link with combinatorics:
<p align="center">$ P(event) = \frac{1}{\#events}$</p>
The probability of an event is one over the number of possible events.  Let’s come back to my die example:
<p align="center">$ P(1) =\frac{1}{\#D}=\frac{1}{6}$</p>
The probability to get a 1 is 1/6 since #D, the cardinality of D (the number of elements in D), is 6.  Same for all the other events, i.e. 2, 3, 4, 5, 6.

So you see the link with combinatorics?  You always compare things that you’ve counted.

If events aren’t equipossible, you transform your problem until they are.  This is where all the fun resides.

Now, as with combinatorics, you can go to town with probability when you start combining events, conditioning events and…  if you start getting into the objective versus subjective (Bayesian) interpretations.  But again, my goal isn’t to deep dive but just to illustrate what probability is.
<h2>Statistics</h2>
<a href="https://en.wikipedia.org/wiki/Statistics" target="_blank"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="http://icons.iconarchive.com/icons/awicons/vista-artistic/128/chart-icon.png" alt="" align="right" border="0" />Statistics</a>:  <em>study of the collection, analysis, interpretation, presentation, and organization of data</em> (Wikipedia)<em>.</em>

I find that definition quite broad as plotting graph becomes statistics.

I prefer to think of statistics as a special class of probability.  In probability we define models by defining sets of events and the likelihood of events to occur ; in statistics we take samples and check how likely they are according to the model.

A <em>sample</em> is simply a real world trial:  throwing a die, tossing a coin, picking an individual from a population, etc.  .

For instance, given my 6 faces die, let’s say I throw it once and I get a 2.  How confident are we that my die is equipossible with 1/6 probability for each face?

Well…  it’s hard to tell, isn’t it?  A lot of probability model could have given that outcome.  Anything where 2 has a non-zero probability really.

What if I throw twice and get a 2 each time?  Well…  that is possible.  What about three 2?  What about 10?  You’ll start to get skeptical about my die being equipossible as we go, won’t you?

Statistics allow you to quantify that.

When you hear about confidence interval around a survey, that’s exactly what that is about.

If I take my sequence of ‘2’ in my die throwing experiment, we can quantify it this way.  Throwing a ‘2’ has a probability of 1/6, which is the same probability for any result.  Now having the same result <em>n</em> times has a probability $ P_{same} = (\frac{1}{6})^{n-1}$ while having a sequence of non-repeating results has probability of $ P_{different} = (\frac{5}{6})^{n-1}$.  So as <em>n</em> increases, it gets less and less likely to have a sequence of the same result.  You can set a threshold and take a decision if you believe the underlying model or not ; in this case, if my die is or not a fair one.
<h2>Why should you care?</h2>
<img style="background-image:none;float:left;padding-top:0;padding-left:0;margin:0 11px 0 0;display:inline;padding-right:0;border-width:0;" src="https://static.pexels.com/photos/6069/grass-lawn-green-wooden-6069.jpg" alt="" width="640" height="427" align="left" border="0" />Statistics is at the core of many empirical sciences.  We use statistics to test theories, to test models.

Also, those three areas of mathematics (i.e. combinatorics, probability &amp; statistics) spawn off into other theories.

For example, <a href="https://en.wikipedia.org/wiki/Information_theory" target="_blank">information theory</a> is based on probability.  That theory in turn helps us understand signal processing &amp; data compression.

<a href="https://vincentlauzon.com/2015/10/18/where-is-the-statistics-in-machine-learning/" target="_blank">Machine Learning can be interpreted as statistics</a>.  In Machine Learning, we define a class of statistical model and then look at samples (training set) to find the best model fitting that sample set.

Moreover, those area of mathematics allow us to quantify observations.  This is key.  In Data Science, you take a volume of data and you try to make it talk.  Statistics help you do that.

When you take a data set and observe some characteristics (e.g. correlation, dependency, etc.), one of the first thing you'll want to validate is the good old "is it statistically significant"?  This is basically figuring out if you could observe those characteristics by chance or are they a real characteristic of the data?  For instance, if I look at cars on the freeway and I observe a blue car then a red car a few times, is that chance or is there enough occurrence to think there is a real pattern?

So if you are <strong>an executive</strong>, you should care about statistics to go beyond just looking (visualizing) the data of your business and understanding, at least at a high level, what type of models and assumptions your data scientists are making on your data.  Are you training models to learn trend in your business?  If so, what are the models look like and how do they perform in terms of prediction?

If you are <strong>a developer / architect</strong>, you should care about statistics for two big reasons.  First, you are probably instrumental in taking decision on what type of data you collect from the application and at which frequency (e.g. telemetry).  If you log the number of users logged in once a day, your data scientists will have a hard time extracting information from that data.  The second reason is that you are likely going to use data to display and, more and more, to have your application take decision.  Try to understand the data and the models used for decision making.

We live in a world of data abundancy.  Data is spewing from every device &amp; every server.  It is easy to see features in data that are simply noise or do not see feature because they aren't visible when you visualize data.  Statistics is the key to your data vault.
<h2>Summary</h2>
I hope my article was more insightful than the statistic classes you remember.

Basically, combinatorics studies countable sets.  Probability uses combinatorics to assign probability (value between 0 &amp; 1) to events.  Statistics takes sample and compare them to probability models.

Those fields of study have massive influence in many other fields.  They are key in Machine Learning and Data Science in general.