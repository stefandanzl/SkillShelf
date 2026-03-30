<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="landing">
  <!-- Hero Section -->
  <section class="landing__hero">
    <div class="landing__hero-content">
      <h1 class="landing__title">SkillShelf</h1>
      <p class="landing__tagline">
        Master anything with flashcards powered by the Leitner algorithm
      </p>
      <div class="landing__cta">
        <button class="landing__btn landing__btn--primary" onclick={() => goto('/sign/up')}>
          Get Started
        </button>
        <button class="landing__btn landing__btn--secondary" onclick={() => goto('/sign/in')}>
          Sign In
        </button>
      </div>
    </div>
  </section>

  <!-- What is SkillShelf -->
  <section class="landing__section">
    <div class="landing__content">
      <h2 class="landing__section-title">What is SkillShelf?</h2>
      <p class="landing__text">
        SkillShelf is a smart flashcard app that helps you learn efficiently using the
        <strong>Leitner algorithm</strong>. Instead of aimlessly swiping through thousands of cards,
        it tracks your memory and shows you the right cards at the right time.
      </p>
      <p class="landing__text">
        Perfect for students, professionals, and anyone who wants to learn languages, memorize
        concepts, or master any subject effectively.
      </p>
    </div>
  </section>

  <!-- Why it's better -->
  <section class="landing__section landing__section--alt">
    <div class="landing__content">
      <h2 class="landing__section-title">Why SkillShelf is Different</h2>
      <p class="landing__text">
        Most flashcard apps rely on <strong>spaced repetition</strong> - you review cards based on
        simple intervals. But not all cards are created equal, and your brain doesn't learn everything
        at the same pace.
      </p>
      <ul class="landing__list">
        <li>
          <strong>Ambiguous difficulty rating:</strong> Rate how hard each card feels, and
          SkillShelf optimally schedules your reviews
        </li>
        <li>
          <strong>No more endless swiping:</strong> Stop mindlessly tapping "Easy" on cards
          you've mastered. Focus on what actually needs your attention.
        </li>
        <li>
          <strong>Scientific approach:</strong> The Leitner algorithm has been refined over
          decades of cognitive science research to maximize long-term retention.
        </li>
      </ul>
    </div>
  </section>

  <!-- How Leitner Works -->
  <section class="landing__section">
    <div class="landing__content">
      <h2 class="landing__section-title">How the Leitner Algorithm Works</h2>

      <div class="landing__steps">
        <div class="landing__step">
          <div class="landing__step-number">1</div>
          <h3>Review Cards</h3>
          <p>Go through your flashcards and rate how well you know each one.</p>
        </div>

        <div class="landing__step">
          <div class="landing__step-number">2</div>
          <h3>Algorithm Schedules</h3>
          <p>
            SkillShelf calculates when you're likely to forget based on your performance.
            Cards you struggle with appear more frequently.
          </p>
        </div>

        <div class="landing__step">
          <div class="landing__step-number">3</div>
          <h3>Track Progress</h3>
          <p>
            Master cards through repeated exposure. The algorithm promotes cards through 7 levels
            as you demonstrate mastery.
          </p>
        </div>
      </div>

      <div class="landing__algorithm">
        <h3>The Secret Sauce: Spaced Intervals</h3>
        <p>
          Instead of fixed schedules, Leitner adapts to <em>your</em> performance.
          A card you miss today will appear again sooner. A card you nail will be pushed further out.
        </p>
        <p class="landing__text">
          The intervals grow exponentially: 1 day &rarr; 3 days &rarr; 1 week &rarr; 2 weeks &rarr; 1 month &rarr; 3 months &rarr; 6 months+.
        </p>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="landing__section landing__section--cta">
    <div class="landing__content">
      <h2 class="landing__section-title">Ready to Learn Smarter?</h2>
      <p class="landing__text">
        Join thousands of learners using science-backed flashcard studying.
      </p>
      <div class="landing__cta">
        <button class="landing__btn landing__btn--large landing__btn--primary" onclick={() => goto('/sign/up')}>
          Create Your First Deck
        </button>
      </div>
    </div>
  </section>
</div>

<style>
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Hero */
  .landing__hero {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-xl);
    background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface-alt) 100%);
  }

  .landing__hero-content {
    max-width: 600px;
  }

  .landing__title {
    font-size: 3rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-sm) 0;
    background: linear-gradient(135deg, var(--color-primary), var(--color-topic-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .landing__tagline {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-xl) 0;
    line-height: 1.5;
  }

  .landing__cta {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Sections */
  .landing__section {
    padding: var(--space-xl);
  }

  .landing__section--alt {
    background: var(--color-surface);
  }

  .landing__section--cta {
    text-align: center;
    padding: var(--space-2xl) var(--space-xl);
  }

  .landing__content {
    max-width: 600px;
    margin: 0 auto;
  }

  .landing__section-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-md) 0;
  }

  .landing__text {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 var(--space-md) 0;
  }

  .landing__text strong {
    color: var(--color-text-primary);
  }

  /* List */
  .landing__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .landing__list li {
    padding: var(--space-sm) 0;
    color: var(--color-text-secondary);
    border-left: 3px solid var(--color-primary);
    padding-left: var(--space-md);
  }

  /* Steps */
  .landing__steps {
    display: grid;
    gap: var(--space-lg);
    margin: var(--space-xl) 0;
  }

  @media (min-width: 640px) {
    .landing__steps {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .landing__step {
    background: var(--color-surface);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    text-align: center;
  }

  .landing__step-number {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    font-weight: 700;
    margin: 0 auto var(--space-sm);
  }

  .landing__step h3 {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-xs);
  }

  .landing__step p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  /* Algorithm box */
  .landing__algorithm {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    margin: var(--space-xl) 0;
  }

  .landing__algorithm h3 {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-sm);
  }

  .landing__algorithm p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-sm);
  }

  .landing__algorithm p:last-child {
    margin: 0;
  }

  /* Buttons */
  .landing__btn {
    font-family: inherit;
    font-size: var(--font-size-base);
    font-weight: 600;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);
  }

  .landing__btn--primary {
    background: var(--color-primary);
    color: white;
  }

  .landing__btn--primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .landing__btn--secondary {
    background: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .landing__btn--secondary:hover {
    background: var(--color-surface);
  }

  .landing__btn--large {
    padding: var(--space-md) var(--space-xl);
    font-size: var(--font-size-lg);
  }
</style>
