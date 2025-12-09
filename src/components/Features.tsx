import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, BookOpen, QrCode } from "lucide-react";
import featureImage1 from "@/assets/feature-image-1.jpg";
import featureImage2 from "@/assets/feature-image-2.jpg";

const features = [
  {
    number: "01",
    title: "Makeup Try-on",
    description:
      "Virtually try-on makeup products in stores or online with results and smart recommendations for styles, and products that suit your skin tone and facial features.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Interactive Tutorials",
    description:
      "Step-by-step makeup guidance and application tutorials for the users' to achieve a desired look. Users can ask questions and receive immediate feedback.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "Look ID",
    description:
      "Every time a custom look is created, either through AI prompting or manual selection, the platform generates a unique Look Code that you can share to your friends or makeup artists.",
    icon: QrCode,
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Features</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="p-8 h-full gradient-card border-0 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-sm text-muted-foreground font-medium">
                    #{feature.number}
                  </span>
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <img
              src={featureImage1}
              alt="Beauty makeup portrait"
              className="rounded-3xl shadow-soft w-full h-auto"
            />
          </div>
          <div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Who we work with
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Monna serves a wide range of partners across the beauty industry and beyond
            </p>
            <div className="space-y-4">
              <div className="p-6 bg-card rounded-2xl shadow-soft">
                <h4 className="font-semibold text-xl mb-2">Beauty Brands</h4>
                <p className="text-muted-foreground">Partner with leading cosmetics companies</p>
              </div>
              <div className="p-6 bg-card rounded-2xl shadow-soft">
                <h4 className="font-semibold text-xl mb-2">Makeup Artists</h4>
                <p className="text-muted-foreground">Empower professionals with AI tools</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
