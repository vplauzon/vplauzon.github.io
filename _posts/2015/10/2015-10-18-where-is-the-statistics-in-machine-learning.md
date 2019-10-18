---
title:  Where is the statistics in Machine Learning?
date:  10/18/2015 23:00:58
permalink:  "/2015/10/18/where-is-the-statistics-in-machine-learning/"
categories:
- Solution
tags:
- Machine Learning
- Mathematics
---
I often try to explain what Machine Learning is to people outside the field.  I'm not always good at it but I am getting better.

One of the confusion I often get when I start to elaborate the details is the presence of statistics in Machine Learning.  For people outside the field, statistics are the stuff of survey or their mandatory science class (everyone I know outside of the Mathematics field who had a mandatory Statistic class in their first Uni year ended up postponing it until the end of their undergraduate studies!).

It feels a bit surprising that statistics would get involved while a computer is learning.

So let's talk about it here.

&nbsp;

Back in the days there was two big tracks of Artificial Intelligence.  One track was about codifying our knowledge and then run the code on a Machine.  The other track was about letting the machine learn from the data ; that is Machine Learning in a nutshell.

The first approach has its merit and had a long string of successes such as <a href="https://en.wikipedia.org/wiki/Expert_system" target="_blank">Expert Systems</a> based on logic and symbolic paradigms.

The best example of those I always give is in vaccine medicine.  The first time I went abroad in tropical countries, in 2000, I went to a vaccine clinic and met with a doctor.  The guy asked me where I was going, consulted a big reference manual, probably used quite a bit of his knowledge and prescribed 3 vaccines his nurse administered to me.  In 2003, when I came back to Canada, I had a similar experience.  In 2009...  nope.  Then I met with a nurse.  She sat behind a computer and asked me similar questions, punching the answer in the software.  The software then prescribed me 7 vaccines to take (yes, it was a more dangerous place to go and I got sick anyway, but that's another story).

That was an expert system.  Somebody sat with experts and asked them how they proceeded when making a vaccine prescriptions.  They took a lot of notes and codify this into a complex software program.

&nbsp;

Expert systems are great at systematizing repetitive tasks requiring a lot of knowledge that can ultimately be described.

If I would ask you to describe me how you differentiate a male from a female face while looking at a photograph, it might get quite hard to codify.  Actually, if you would answer me at all, you would probably give a bad recipe since you do that unconsciously and you aren't aware of %20 of what your brain does to take the decision.

For those types of problems, Machine Learning tends to do better.

A great example of this is how much better Machine Learning is at solving translation problems.  A turning point was the use of <a href="https://en.wikipedia.org/wiki/Hansard#Translation" target="_blank">Canadian Hansards</a> (transcripts of Parliamentary Debates in both French &amp; English) to train machines how to translate between the two languages.

Some people, e.g. <a href="https://en.wikipedia.org/wiki/Noam_Chomsky" target="_blank">Chomsky</a>, opposes Machine Learning as it actually hides the codification of knowledge.  Actually there is an interesting field developing to use machines to <a href="https://www.quantamagazine.org/20150723-computer-explanation/" target="_blank">build explanation out of complicated mathematical proofs</a>.

&nbsp;

Nevertheless, why is there statistics in Machine Learning?

<a href="https://vincentlauzon.files.wordpress.com/2015/06/image3.png"><img class="wp-image-875 alignleft" src="https://vincentlauzon.files.wordpress.com/2015/06/image3.png" alt="image.png" width="393" height="347" /></a>When I wrote <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/">posts about Machine Learning to explain the basics</a>, I gave an example of linear regression on a 2D data sets.

I glossed over the fact that the data, although vaguely linear, wasn't a perfect line, far from it.  Nevertheless, the model we used was a line.

This is where a statistical interpretation can come into play.

Basically, we can interpret the data in many ways.  We could say that the data is linear but there were errors in measurements.  We could say that there are much more variables involves that aren't part of the dataset but we'll consider those as random since we do not know them.

Both explanation links to statistics and probability.  In the first one we suppose the errors are randomly distributed and explain deviation from linear distribution.  In the second we assume missing data (variables) that if present would make the dataset deterministic but in its absence we model as a random distribution.

Actually, there is a long held debate in physics around the interpretation of Quantum Mechanics that oppose those two explanations.

&nbsp;

In our case, the important point is that when we build a machine learning model out of a data set, we assume our model will predict the expectation (or average if you will) of an underlying distribution.

&nbsp;

Machine Learning &amp; Statistics are two sides of the same coin.  Unfortunately, they were born from quite different scientific disciplines, have different culture and vocabularies that entertain confusion to this day.  A good article explaining those differences can be <a href="http://www.galvanize.com/blog/2015/08/26/why-a-mathematician-statistician-machine-learner-solve-the-same-problem-differently-2" target="_blank">found here</a>.