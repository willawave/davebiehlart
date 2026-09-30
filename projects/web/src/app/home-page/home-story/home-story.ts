import { Component } from '@angular/core';

interface Chapter {
  numeral: string;
  when: string;
  title: string;
  text: string;
}

// Dave's path from ranch to foundry.
@Component({
  selector: 'app-home-story',
  styleUrl: './home-story.scss',
  template: `
    <section class="chapters" aria-labelledby="story-title">
      <p class="label">Five chapters</p>
      <h2 id="story-title">From clay to bronze</h2>
      <ol>
        @for (chapter of chapters; track chapter.numeral) {
          <li>
            <span class="numeral" aria-hidden="true">{{ chapter.numeral }}</span>
            <div>
              <p class="label">{{ chapter.when }}</p>
              <h3>{{ chapter.title }}</h3>
              <p class="text">{{ chapter.text }}</p>
            </div>
          </li>
        }
      </ol>
    </section>
  `,
})
export class HomeStory {
  protected readonly chapters: readonly Chapter[] = [
    {
      numeral: 'I',
      when: 'Lexington, Nebraska',
      title: 'Raised on the ranch',
      text: 'Riding horses, working cows, caring for animals and helping his dad farm. Every waking moment outside.',
    },
    {
      numeral: 'II',
      when: '1976',
      title: 'Doctor of Veterinary Medicine',
      text: 'Kansas State University. Science was the career; art was always the pull.',
    },
    {
      numeral: 'III',
      when: '2003',
      title: 'Sculpture in the Park',
      text: 'One visit to Loveland, Colorado, and he was hooked.',
    },
    {
      numeral: 'IV',
      when: 'A bag of used clay',
      title: 'Self-taught',
      text: 'A local sculptor handed him leftover modeling clay. He taught himself the rest.',
    },
    {
      numeral: 'V',
      when: 'Today',
      title: 'Commissions',
      text: 'Most of his life-size and miniature work is made for individuals and organizations.',
    },
  ];
}
